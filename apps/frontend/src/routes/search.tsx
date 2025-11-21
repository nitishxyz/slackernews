import { createFileRoute, Link } from '@tanstack/react-router'
import { PostItem } from '../components/PostItem'
import { searchPosts } from '../server/posts'
import { timeAgo } from '../lib/utils'
import { z } from 'zod'

const SearchSchema = z.object({
  q: z.string().min(1).catch(''),
  page: z.number().default(1).catch(1),
})

export const Route = createFileRoute('/search')({
  validateSearch: (search) => SearchSchema.parse(search),
  loaderDeps: ({ search: { q, page } }) => ({ q, page }),
  loader: async ({ deps: { q, page } }) => {
    if (!q) {
      return { 
        latestPosts: [],
        hasMore: false,
        page: 1,
        query: ''
      }
    }
    const { posts, hasMore } = await searchPosts({ data: { query: q, page, limit: 30 } })
    return { 
      latestPosts: posts.map(p => ({
        id: p.id,
        title: p.title,
        url: p.url,
        score: p.score,
        by: p.by,
        time: timeAgo(p.createdAt),
        descendants: p.commentCount,
        userUpvoted: p.userUpvoted
      })),
      hasMore,
      page,
      query: q
    }
  },
  component: SearchPage,
})

function SearchPage() {
  const { latestPosts, hasMore, page, query } = Route.useLoaderData()

  return (
    <div className="pt-2 pb-8">
      {query && (
        <div className="ml-9 mb-4 text-[13px] text-[#828282]">
          Search results for: <span className="font-medium text-black">{query}</span>
        </div>
      )}
      <div className="space-y-0">
        {latestPosts.map((post, i) => (
          <PostItem key={post.id} post={post} index={(page - 1) * 30 + i + 1} />
        ))}
      </div>
      {latestPosts.length === 0 && query && (
        <div className="ml-9 mt-4 text-[13px] text-[#828282]">
          No results found.
        </div>
      )}
      {latestPosts.length > 0 && (
        <div className="ml-9 mt-4 text-[13px]">
          {page > 1 && (
            <Link 
              to="/search" 
              search={{ q: query, page: page - 1 }}
              className="text-black hover:underline"
            >
              &lt; prev
            </Link>
          )}
          {page > 1 && <span className="mx-2 text-[#828282]">|</span>}
          <span className="text-[#828282]">Page {page}</span>
          {hasMore && <span className="mx-2 text-[#828282]">|</span>}
          {hasMore && (
            <Link 
              to="/search" 
              search={{ q: query, page: page + 1 }}
              className="text-black hover:underline"
            >
              more &gt;
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
