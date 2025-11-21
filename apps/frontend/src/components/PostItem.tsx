import { Link, useRouter } from '@tanstack/react-router'
import { usePrivy } from '@privy-io/react-auth'
import { toggleUpvote } from '../server/upvotes'
import { useState } from 'react'
import { cn } from '../lib/utils'
import { useAuthToken } from '../hooks/useAuthToken'

export interface PostProps {
  id: number
  title: string
  url?: string | null
  score: number
  by: string
  time: string
  descendants: number
  userUpvoted?: boolean
}

export function PostItem({ post, index }: { post: PostProps; index: number }) {
  const domain = post.url ? new URL(post.url).hostname.replace('www.', '') : null
  const { authenticated, login } = usePrivy();
  const router = useRouter();
  const { token, loading: tokenLoading } = useAuthToken();
  
  const [optimisticUpvote, setOptimisticUpvote] = useState<boolean | null>(null);
  const baseUpvoted = post.userUpvoted ?? false;
  const isUpvoted = optimisticUpvote !== null ? optimisticUpvote : baseUpvoted;
  const scoreDelta = (isUpvoted ? 1 : 0) - (baseUpvoted ? 1 : 0);
  const displayScore = post.score + scoreDelta;

  const handleUpvote = async () => {
    if (!authenticated) {
        login();
        return;
    }

    if (!token || tokenLoading) {
      console.error("No identity token available");
      return;
    }

    const newValue = !isUpvoted;
    setOptimisticUpvote(newValue);

    try {
        await toggleUpvote({
            data: {
                postId: post.id,
            },
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        await router.invalidate();
    } catch (e) {
        setOptimisticUpvote(null);
        console.error(e);
    }
  }

  return (
    <div className="flex gap-1 md:gap-2 px-2 md:px-3 py-2 md:py-1 text-[13px] leading-tight">
      <div className="text-[#828282] w-5 md:w-6 text-right font-medium shrink-0 pt-0.5">
        {index > 0 ? `${index}.` : ''}
      </div>
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <div className="p-1 -ml-1 cursor-pointer" title={isUpvoted ? 'unvote' : 'upvote'} onClick={handleUpvote}>
             <span className={cn(
                 "arrow-up w-2.5 h-2.5 border-b-[8px] border-x-[4px] border-x-transparent mb-0.5 inline-block",
                 isUpvoted ? "border-b-[#4c1d95]" : "border-b-[#c6c6c6]"
             )}></span>
          </div>
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
          {displayScore} points by{' '}
          <a href={`/user/${post.by}`} className="hover:underline">
            {post.by}
          </a>{' '}
          <span title={post.time}>{post.time}</span>
          {isUpvoted && (
            <>
              {' '}|{' '}
              <button
                type="button"
                onClick={handleUpvote}
                className="hover:underline text-[#828282]"
              >
                unvote
              </button>
            </>
          )}{' '}
          |{' '}
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
