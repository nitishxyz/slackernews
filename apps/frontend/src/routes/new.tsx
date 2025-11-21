import { createFileRoute, Link } from '@tanstack/react-router'
import { PostItem } from '../components/PostItem'
import { fetchPosts } from '../server/posts'
import { timeAgo } from '../lib/utils'
import { z } from 'zod'

const PostSearchSchema = z.object({
  page: z.number().default(1).catch(1),
})

export const Route = createFileRoute('/new')({
  validateSearch: (search) => PostSearchSchema.parse(search),
  loaderDeps: ({ search: { page } }) => ({ page }),
  loader: async ({ deps: { page } }) => {
    const { posts, hasMore } = await fetchPosts({ data: { page, sort: 'new' } })
    return { 
      posts: posts.map(p => ({
        id: p.id,
        title: p.title,
        url: p.url,
        score: p.score,
        by: p.by,
        time: timeAgo(p.createdAt),
        descendants: p.commentCount,
        userUpvoted: p.userUpvoted
      })),
      hasMore
    }
  },
  component: NewPage,
})

function NewPage() {
  const { posts, hasMore } = Route.useLoaderData()
  const { page } = Route.useSearch()

  return (
    <div className="bg-[#f6f6ef] pt-2 pb-8">
       <div className="space-y-0">
        {posts.map((post, i) => (
          <PostItem key={post.id} post={post} index={(page - 1) * 30 + i + 1} />
        ))}
      </div>
      {hasMore && (
        <div className="ml-9 mt-4">
            <Link 
                to="/new" 
                search={{ page: page + 1 }} 
                className="text-black font-medium hover:underline text-[13px]"
            >
                More
            </Link>
        </div>
      )}
    </div>
  )
}
