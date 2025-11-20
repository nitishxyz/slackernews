import { Link } from '@tanstack/react-router'

export interface PostProps {
  id: number
  title: string
  url?: string | null
  score: number
  by: string
  time: string // or number/Date
  descendants: number
}

export function PostItem({ post, index }: { post: PostProps; index: number }) {
  const domain = post.url ? new URL(post.url).hostname.replace('www.', '') : null

  return (
    <div className="flex gap-1 px-2 py-1 text-[13px] leading-tight">
      <div className="text-[#828282] w-6 text-right font-medium shrink-0">
        {index > 0 ? `${index}.` : ''}
      </div>
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span className="arrow-up w-2.5 h-2.5 border-b-[8px] border-b-[#4c1d95] border-x-[4px] border-x-transparent mb-0.5 inline-block cursor-pointer" title="upvote"></span>
          {post.url ? (
            <a href={post.url} target="_blank" rel="noreferrer" className="text-black visited:text-[#828282] font-medium hover:underline">
              {post.title}
            </a>
          ) : (
            <Link
              to="/item/$id"
              params={{ id: post.id.toString() }}
              className="text-black visited:text-[#828282] font-medium hover:underline"
            >
              {post.title}
            </Link>
          )}
          {domain && (
            <span className="text-[#828282] text-xs">
              {' '}(<a href={`/from?site=${domain}`} className="hover:underline">{domain}</a>)
            </span>
          )}
        </div>
        <div className="text-[10px] text-[#828282] pl-4">
          {post.score} points by{' '}
          <a href={`/user/${post.by}`} className="hover:underline">
            {post.by}
          </a>{' '}
          <span title={post.time}>{post.time}</span> |{' '}
          <span className="cursor-pointer hover:underline">hide</span> |{' '}
          <Link 
            to="/item/$id" 
            params={{ id: post.id.toString() }} 
            className="hover:underline"
          >
            {post.descendants} comments
          </Link>
        </div>
      </div>
    </div>
  )
}
