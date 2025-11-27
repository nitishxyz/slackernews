import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from '@tanstack/react-router'
import { submitComment } from '../server/comments'
import { toggleUpvote } from '../server/upvotes'
import { cn } from '../lib/utils'
import { useAuthToken } from '../hooks/useAuthToken'

export interface CommentProps {
  id: number
  by: string
  time: string
  text: string
  score: number
  userUpvoted?: boolean
  postId: number
  parentId: number | null
  children: CommentProps[]
  totalChildren?: number
}

export function CommentItem({ comment }: { comment: CommentProps }) {
  const [replying, setReplying] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [optimisticUpvote, setOptimisticUpvote] = useState<boolean | null>(null);
  const [optimisticChildren, setOptimisticChildren] = useState<CommentProps[]>([]);
  const { authenticated, login } = usePrivy();
  const router = useRouter();
  const { token, loading: tokenLoading } = useAuthToken();

  const baseUpvoted = comment.userUpvoted ?? false;
  const isUpvoted = optimisticUpvote !== null ? optimisticUpvote : baseUpvoted;
  const scoreDelta = (isUpvoted ? 1 : 0) - (baseUpvoted ? 1 : 0);
  const displayScore = (comment.score || 0) + scoreDelta;

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
                commentId: comment.id,
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

  const handleReply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!authenticated) {
      login();
      return;
    }

    if (!token) {
      console.error("No auth token available");
      return;
    }

    const form = e.currentTarget;
    const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value;
    if (!content) return;

    setSubmitting(true);
    const result = await submitComment({
      data: {
        postId: comment.postId,
        parentId: comment.id,
        content,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setSubmitting(false);

    if (result.success && result.comment) {
        const newComment: CommentProps = {
            id: result.comment.id,
            by: result.username,
            time: "just now",
            text: result.comment.content,
            score: 1,
            userUpvoted: true,
            postId: result.comment.postId,
            parentId: comment.id,
            children: [],
            totalChildren: 0
        };
        setOptimisticChildren(prev => [newComment, ...prev]);
    }

    form.reset();
    setReplying(false);
    router.invalidate();
  };

  const hiddenCount = 1 + (comment.totalChildren || 0);

  return (
    <div className="mb-2 text-[13px]">
        <div className="text-[#828282] text-xs mb-1 flex flex-wrap items-baseline gap-1">
            <div className="cursor-pointer" title={isUpvoted ? 'unvote' : 'upvote'} onClick={handleUpvote}>
               <span className={cn(
                 "arrow-up w-2 h-2 border-b-[6px] border-x-[3px] border-x-transparent mb-0.5 inline-block",
                 isUpvoted ? "border-b-[#4c1d95]" : "border-b-[#c6c6c6]"
               )}></span>
            </div>
            <span className="cursor-pointer hover:underline" onClick={() => setCollapsed(!collapsed)}>{comment.by}</span>
            <span>{displayScore} points</span>
            <span>{comment.time}</span>
            <span className="hover:underline cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
                {collapsed ? `[+${hiddenCount}]` : '[-]'}
            </span>
            {!collapsed && <button onClick={() => setReplying(!replying)} className="ml-2 hover:underline underline text-xs">reply</button>}
        </div>
        
        {collapsed ? null : (
        <>
        <div className="text-black pl-1 text-sm">
            {comment.text}
        </div>
        
        {replying && (
            <form onSubmit={handleReply} className="mt-2 ml-4">
                <textarea name="content" rows={3} className="w-full max-w-xl border border-gray-300 p-2 text-sm mb-2 disabled:opacity-50" disabled={submitting} />
                <br />
                <button type="submit" disabled={submitting} className="bg-background border border-gray-400 px-4 py-1 font-medium text-black hover:border-black rounded-sm text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                    {submitting ? 'replying...' : 'reply'}
                </button>
            </form>
        )}

        <div className="pl-3 md:pl-8 mt-2">
            {optimisticChildren.filter(opt => !comment.children?.some(c => c.id === opt.id)).map((child) => (
                <CommentItem key={child.id} comment={child} />
            ))}
            {comment.children && comment.children.length > 0 && comment.children.map((child) => (
                <CommentItem key={child.id} comment={child} />
            ))}
        </div>
        </>
        )}
    </div>
  )
}
