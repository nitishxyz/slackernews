import { createFileRoute } from '@tanstack/react-router'
import { PostItem, type PostProps } from '../components/PostItem'

// Mock data
const MOCK_NEW_POSTS: PostProps[] = [
  {
    id: 101,
    title: "Just launched my first SaaS",
    url: "https://example.com",
    score: 1,
    by: "indiehacker",
    time: "1 minute ago",
    descendants: 0
  },
  {
    id: 102,
    title: "Why C++ is still relevant",
    url: "https://isocpp.org",
    score: 2,
    by: "cpp_fan",
    time: "5 minutes ago",
    descendants: 0
  },
  {
    id: 103,
    title: "Show SN: A CLI tool for Slack",
    url: "https://github.com/slackernews/cli",
    score: 4,
    by: "cli_guy",
    time: "10 minutes ago",
    descendants: 1
  }
]

export const Route = createFileRoute('/new')({
  component: NewPage,
  loader: async () => {
    return { posts: MOCK_NEW_POSTS };
  },
})

function NewPage() {
  const { posts } = Route.useLoaderData()

  return (
    <div className="bg-background min-h-screen pt-2 pb-8">
       <div className="space-y-0">
        {posts.map((post, i) => (
          <PostItem key={post.id} post={post} index={i + 1} />
        ))}
      </div>
      <div className="ml-9 mt-4">
        <a href="/new?p=2" className="text-black font-medium hover:underline text-[13px]">More</a>
      </div>
    </div>
  )
}
