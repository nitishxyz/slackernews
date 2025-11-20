import { createFileRoute } from '@tanstack/react-router'
import { PostItem, type PostProps } from '../components/PostItem'

// Mock data for UI scaffold
const MOCK_POSTS: PostProps[] = [
  {
    id: 1,
    title: "SlackerNews: The High-Signal Platform",
    url: "https://slackernews.com",
    score: 156,
    by: "batman",
    time: "2 hours ago",
    descendants: 42
  },
  {
    id: 2,
    title: "Show SN: A serverless monorepo with TanStack Start",
    url: "https://github.com/tanstack/start",
    score: 89,
    by: "tanner",
    time: "3 hours ago",
    descendants: 12
  },
  {
    id: 3,
    title: "Why Solana is perfect for micro-payments",
    url: "https://solana.com",
    score: 234,
    by: "anatoly",
    time: "5 hours ago",
    descendants: 89
  },
  {
    id: 4,
    title: "Understanding OkLCH color space",
    url: "https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl",
    score: 45,
    by: "css_wizard",
    time: "6 hours ago",
    descendants: 5
  },
  {
    id: 5,
    title: "How to build a compiler in Bun",
    url: null,
    score: 67,
    by: "jarred",
    time: "7 hours ago",
    descendants: 15
  }
]

export const Route = createFileRoute('/')({
  component: App,
  loader: async () => {
    // In the future, this will fetch from DB
    // const latestPosts = await db.select().from(posts).limit(30);
    return { latestPosts: MOCK_POSTS };
  },
})

function App() {
  const { latestPosts } = Route.useLoaderData()

  return (
    <div className="bg-background min-h-screen pt-2 pb-8">
      <div className="space-y-0">
        {latestPosts.map((post, i) => (
          <PostItem key={post.id} post={post} index={i + 1} />
        ))}
      </div>
      <div className="ml-9 mt-4">
        <a href="/news?p=2" className="text-black font-medium hover:underline text-[13px]">More</a>
      </div>
      
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
        <div className="mt-4 relative w-full max-w-md mx-auto">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">Search:</span>
            <input type="text" className="w-full border border-gray-300 p-1 pl-16 text-sm" />
        </div>
      </footer>
    </div>
  )
}
