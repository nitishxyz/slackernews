import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from '@tanstack/react-router'
import { submitComment } from '../server/comments'
import { useAuthToken } from '../hooks/useAuthToken'

export interface CommentProps {
    id: number
    by: string
    time: string
    text: string
    postId: number
    parentId: number | null
    children: CommentProps[]
    totalChildren?: number
}

export function CommentItem({ comment }: { comment: CommentProps }) {
  const [replying, setReplying] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { authenticated, login } = usePrivy();
  const router = useRouter();
  const { token } = useAuthToken();

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

    await submitComment({
      data: {
        postId: comment.postId,
        parentId: comment.id,
        content,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    form.reset();
    setReplying(false);
    router.invalidate();
  };

  const hiddenCount = 1 + (comment.totalChildren || 0);

  return (
    <div className="mb-2 text-[13px]">
        <div className="text-[#828282] mb-1">
            <span className="cursor-pointer hover:underline text-black font-medium" onClick={() => setCollapsed(!collapsed)}>{comment.by}</span>{' '}
            <span>{comment.time}</span>{' '}
            <span className="hover:underline cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
                {collapsed ? `[+${hiddenCount}]` : '[-]'}
            </span>
            {!collapsed && <button onClick={() => setReplying(!replying)} className="ml-2 hover:underline underline text-xs">reply</button>}
        </div>
        
        {collapsed ? null : (
        <>
        <div className="text-black pl-1">
            {comment.text}
        </div>
        
        {replying && (
            <form onSubmit={handleReply} className="mt-2 ml-4">
                <textarea name="content" rows={3} className="w-full max-w-xl border border-gray-300 p-2 text-sm mb-2" />
                <br />
                <button type="submit" className="bg-background border border-gray-400 px-4 py-1 font-medium text-black hover:border-black rounded-sm text-xs">
                    reply
                </button>
            </form>
        )}

        <div className="pl-3 md:pl-8 mt-2">
            {comment.children && comment.children.length > 0 && comment.children.map((child) => (
                <CommentItem key={child.id} comment={child} />
            ))}
        </div>
        </>
        )}
    </div>
  )
}
