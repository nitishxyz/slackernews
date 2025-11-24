import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { fetchUserComments } from '../server/comments'
import { timeAgo } from '../lib/utils'
import { z } from 'zod'
import { toggleUpvote } from '../server/upvotes'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuthToken } from '../hooks/useAuthToken'
import { cn } from '../lib/utils'

const CommentsSearchSchema = z.object({
  page: z.number().default(1).catch(1),
})

export const Route = createFileRoute('/c/$username')({
  validateSearch: (search) => CommentsSearchSchema.parse(search),
  loaderDeps: ({ search: { page } }) => ({ page }),
  loader: async ({ deps, params }) => {
    const { page } = deps;
    const username = params.username;
    const { comments, hasMore } = await fetchUserComments({ data: { username, page, limit: 30 } })
    return { 
      userComments: comments.map(c => ({
        id: c.id,
        content: c.content,
        by: c.by,
        username: c.username,
        time: timeAgo(c.createdAt),
        score: c.score,
        postId: c.postId,
        postTitle: c.postTitle,
        userUpvoted: c.userUpvoted
      })),
      hasMore,
      page,
      username
    }
  },
  component: UserCommentsPage,
})

function UserCommentsPage() {
  const { userComments, hasMore, page, username } = Route.useLoaderData()
  const { authenticated, login } = usePrivy()
  const router = useRouter()
  const { token } = useAuthToken()
  const navigate = useNavigate()
  const [optimisticUpvotes, setOptimisticUpvotes] = useState<Record<number, boolean | null>>({})

  const handleUpvote = async (commentId: number, currentUpvoted: boolean) => {
    if (!authenticated) {
      login()
      return
    }

    if (!token) {
      console.error("No identity token available")
      return
    }

    const newValue = !currentUpvoted
    setOptimisticUpvotes(prev => ({ ...prev, [commentId]: newValue }))

    try {
      await toggleUpvote({
        data: { commentId },
        headers: { Authorization: `Bearer ${token}` }
      })
      await router.invalidate()
    } catch (e) {
      setOptimisticUpvotes(prev => ({ ...prev, [commentId]: null }))
      console.error(e)
    }
  }

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const query = e.currentTarget.value.trim()
      if (query) {
        navigate({ to: '/search', search: { q: query, page: 1 } })
      }
    }
  }

  return (
    <div className="pt-2 pb-8">
      <div className="space-y-0">
        {userComments.map((comment, i) => {
          const optimisticUpvoted = optimisticUpvotes[comment.id]
          const isUpvoted = optimisticUpvoted !== null ? optimisticUpvoted : (comment.userUpvoted ?? false)
          const displayScore = comment.score

          return (
            <div key={comment.id} className="flex gap-1 md:gap-2 px-2 md:px-3 py-2 md:py-1 text-[13px] leading-tight">
              <div className="text-[#828282] w-5 md:w-6 text-right font-medium shrink-0 pt-0.5">
                {i + 1 + (page - 1) * 30}.
              </div>
              <div className="flex flex-col flex-1">
                <div className="flex items-baseline gap-1">
                  <div className="p-1 -ml-1 cursor-pointer" title={isUpvoted ? 'unvote' : 'upvote'} onClick={() => handleUpvote(comment.id, isUpvoted)}>
                    <span className={cn(
                      "arrow-up w-2.5 h-2.5 border-x-transparent mb-0.5 inline-block",
                      isUpvoted ? "border-b-[#4c1d95]" : "border-b-[#c6c6c6]"
                    )}></span>
                  </div>
                  <div className="text-black">
                    {comment.content}
                  </div>
                </div>
                <div className="text-[10px] text-[#828282] pl-4 mt-1">
                  {displayScore} points by{' '}
                  {comment.username ? (
                    <Link 
                      to="/user/$username" 
                      params={{ username: comment.username }}
                      className="hover:underline"
                    >
                      {comment.by}
                    </Link>
                  ) : (
                    <span>{comment.by}</span>
                  )}{' '}
                  <span title={comment.time}>{comment.time}</span>
                  {' | '}
                  <Link 
                    to="/item/$id" 
                    params={{ id: comment.postId.toString() }}
                    className="hover:underline"
                  >
                    on: {comment.postTitle || `Post #${comment.postId}`}
                  </Link>
                  {isUpvoted && (
                    <>
                      {' | '}
                      <button
                        type="button"
                        onClick={() => handleUpvote(comment.id, isUpvoted)}
                        className="hover:underline text-[#828282]"
                      >
                        unvote
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="ml-9 mt-4 text-[13px]">
        {page > 1 && (
          <Link 
            to="/c/$username" 
            params={{ username }}
            search={{ page: page - 1 }}
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
            to="/c/$username" 
            params={{ username }}
            search={{ page: page + 1 }}
            className="text-black hover:underline"
          >
            more &gt;
          </Link>
        )}
      </div>
      
      <footer className="mt-10 border-t-2 border-[#4c1d95] pt-4 text-center text-[10px] text-gray-500">
        <div className="mt-2">
          <a href="https://solana.com" target="_blank" rel="noreferrer noopener nofollow" className="hover:underline">Solana</a>{' | '}
          <a href="https://solanamobile.com/" target="_blank" rel="noreferrer noopener nofollow" className="hover:underline">Solana Mobile</a>{' | '}
          <a href="https://superteam.fun" target="_blank" rel="noreferrer noopener nofollow" className="hover:underline">Superteam</a>{' | '}
          <a href="https://colosseum.com" target="_blank" rel="noreferrer noopener nofollow" className="hover:underline">Colosseum</a>{' | '}
          <a href="https://x.com/nitishxyz" target="_blank" rel="noreferrer noopener nofollow" className="hover:underline">Dev</a>
        </div>
        <div className="mt-4 px-4 md:px-0">
          <div className="relative w-full max-w-md mx-auto">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">Search:</span>
              <input 
                type="text" 
                className="w-full border border-gray-300 p-1 pl-16 text-sm" 
                onKeyDown={handleSearch}
                placeholder="Search posts..."
              />
          </div>
        </div>
      </footer>
    </div>
  )
}

