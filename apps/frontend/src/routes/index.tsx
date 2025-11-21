import { createFileRoute, Link } from '@tanstack/react-router'
import { PostItem } from '../components/PostItem'
import { fetchPosts } from '../server/posts'
import { timeAgo } from '../lib/utils'
import { z } from 'zod'

const PostSearchSchema = z.object({
  page: z.number().default(1).catch(1),
  sort: z.enum(['new', 'top']).default('new').catch('new'),
})

export const Route = createFileRoute('/')({
  validateSearch: (search) => PostSearchSchema.parse(search),
  loaderDeps: ({ search: { page, sort } }) => ({ page, sort }),
  loader: async ({ deps: { page, sort } }) => {
    // Note: Can't use usePrivy in loader, will be handled client-side
    const { posts, hasMore } = await fetchPosts({ data: { page, sort } })
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
      hasMore
    }
  },
  component: App,
})

function App() {
  const { latestPosts, hasMore } = Route.useLoaderData()
  const { page } = Route.useSearch()

  const handleLoadMore = async () => {
    // Could refresh with auth token here if needed
  }

  return (
    <div className="pt-2 pb-8">
      <div className="space-y-0">
        {latestPosts.map((post, i) => (
          <PostItem key={post.id} post={post} index={(page - 1) * 30 + i + 1} />
        ))}
      </div>
      {hasMore && (
        <div className="ml-9 mt-4">
          <Link 
            to="/" 
            search={{ page: page + 1 }}
            className="text-black font-medium hover:underline text-[13px]"
          >
            More
          </Link>
        </div>
      )}
      
      <footer className="mt-10 border-t-2 border-[#4c1d95] pt-4 text-center text-[10px] text-gray-500">
        <p>
          Applications are open for Solana Radar Hackathon
        </p>
        <div className="mt-2">
          <a href="#" className="hover:underline">Guidelines</a>{' | '}
          <a href="#" className="hover:underline">FAQ</a>{' | '}
          <a href="#" className="hover:underline">Lists</a>{' | '}
          <a href="#" className="hover:underline">API</a>{' | '}
          <a href="#" className="hover:underline">Security</a>{' | '}
          <a href="#" className="hover:underline">Legal</a>{' | '}
          <a href="#" className="hover:underline">Apply to Colosseum</a>{' | '}
          <a href="#" className="hover:underline">Contact</a>
        </div>
        <div className="mt-4 px-4 md:px-0">
          <div className="relative w-full max-w-md mx-auto">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">Search:</span>
              <input type="text" className="w-full border border-gray-300 p-1 pl-16 text-sm" />
          </div>
        </div>
      </footer>
    </div>
  )
}
