import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from '@tanstack/react-router'
import { submitComment } from '../server/comments'

export interface CommentProps {
    id: number
    by: string
    time: string
    text: string
    postId: number
    parentId: number | null
    children: CommentProps[]
}

export function CommentItem({ comment }: { comment: CommentProps }) {
  const [replying, setReplying] = useState(false);
  const { getAccessToken } = usePrivy();
  const router = useRouter();

  const handleReply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value;
    if (!content) return;

    const token = await getAccessToken();
    if (!token) return; // Handle auth error

    await submitComment({
      data: {
        postId: comment.postId,
        parentId: comment.id,
        content,
        authToken: token
      }
    });

    form.reset();
    setReplying(false);
    router.invalidate();
  };

  return (
    <div className="mb-2 text-[13px]">
        <div className="text-[#828282] mb-1">
            <span className="cursor-pointer hover:underline text-black font-medium">{comment.by}</span>{' '}
            <span>{comment.time}</span>{' '}
            <span className="hover:underline cursor-pointer">[-]</span>
            <button onClick={() => setReplying(!replying)} className="ml-2 hover:underline underline text-xs">reply</button>
        </div>
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
    </div>
  )
}
