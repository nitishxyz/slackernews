import { createFileRoute } from '@tanstack/react-router'
import { PostItem } from '../components/PostItem'

// Mock Data
const MOCK_POST = {
  id: 1,
  title: "SlackerNews: The High-Signal Platform",
  url: "https://slackernews.com",
  score: 156,
  by: "batman",
  time: "2 hours ago",
  descendants: 42,
  text: "We built this to solve the noise problem. Let us know what you think!"
}

const MOCK_COMMENTS = [
  {
    id: 101,
    by: "user1",
    time: "1 hour ago",
    text: "This looks amazing! I love the retro feel.",
    children: [
      {
        id: 102,
        by: "batman",
        time: "45 minutes ago",
        text: "Thanks! We wanted to pay homage to the original.",
        children: []
      }
    ]
  },
  {
    id: 103,
    by: "critic99",
    time: "1.5 hours ago",
    text: "Why another aggregator? What makes this different?",
    children: [
      {
        id: 104,
        by: "batman",
        time: "1 hour ago",
        text: "Skin in the game. You pay to play, which reduces spam.",
        children: [
             {
                id: 105,
                by: "critic99",
                time: "30 minutes ago",
                text: "Interesting economic model.",
                children: []
             }
        ]
      }
    ]
  }
]

export const Route = createFileRoute('/item/$id')({
  component: ItemPage,
  loader: async ({ params }) => {
    // In real app, fetch post by params.id
    return { post: MOCK_POST, comments: MOCK_COMMENTS }
  }
})

function CommentItem({ comment }: { comment: any }) {
  return (
    <div className="mb-2 text-[13px]">
        <div className="text-[#828282] mb-1">
            <span className="cursor-pointer hover:underline text-black font-medium">{comment.by}</span>{' '}
            <span>{comment.time}</span>{' '}
            <span className="hover:underline cursor-pointer">[-]</span>
        </div>
        <div className="text-black pl-1">
            {comment.text}
        </div>
        <div className="pl-8 mt-2">
            {comment.children.map((child: any) => (
                <CommentItem key={child.id} comment={child} />
            ))}
        </div>
    </div>
  )
}

function ItemPage() {
  const { post, comments } = Route.useLoaderData()

  return (
    <div className="bg-background min-h-screen pt-2 px-4">
       <PostItem post={post} index={0} /> {/* Index 0 or hide rank? HN hides rank on item page usually, but PostItem expects it. We can hide it via CSS or just pass 0. Actually HN usually just shows the title larger? Let's stick to PostItem for consistency for now but maybe tweak it later. */}
       
       {post.text && (
         <div className="pl-8 mt-4 text-[13px] max-w-4xl text-black">
            {post.text}
         </div>
       )}

       <div className="mt-8 pl-4">
         <form className="mb-8">
            <textarea rows={6} className="w-full max-w-xl border border-gray-300 p-2 text-sm mb-2" />
            <br />
            <button type="submit" className="bg-background border border-gray-400 px-4 py-1 font-medium text-black hover:border-black rounded-sm text-xs">
                add comment
            </button>
         </form>

         {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
         ))}
       </div>
    </div>
  )
}
