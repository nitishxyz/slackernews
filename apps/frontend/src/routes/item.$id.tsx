import { createFileRoute, useRouter } from '@tanstack/react-router'
import { PostItem } from '../components/PostItem'
import { CommentItem, CommentProps } from '../components/CommentItem'
import { fetchPost } from '../server/posts'
import { submitComment } from '../server/comments'
import { timeAgo } from '../lib/utils'
import { usePrivy } from '@privy-io/react-auth'
import { useState } from 'react'

export const Route = createFileRoute('/item/$id')({
  component: ItemPage,
  loader: async ({ params }) => {
    const result = await fetchPost({ data: { postId: Number(params.id) } });
    if (!result) throw new Error("Post not found"); // Simple error handling
    
    const { comments, ...post } = result;
    
    // Build Tree
    const map: Record<number, any> = {};
    const roots: any[] = [];
    
    // First pass: create nodes
    comments.forEach(c => {
      map[c.id] = { 
        ...c, 
        children: [],
        time: timeAgo(c.createdAt),
        text: c.content 
      };
    });
    
    // Second pass: link children
    comments.forEach(c => {
      if (c.parentId && map[c.parentId]) {
        map[c.parentId].children.push(map[c.id]);
      } else {
        roots.push(map[c.id]);
      }
    });

    return { 
      post: {
        id: post.id,
        title: post.title,
        url: post.url,
        score: post.score,
        by: post.by,
        time: timeAgo(post.createdAt),
        descendants: post.commentCount,
        text: post.content
      },
      comments: roots as CommentProps[]
    }
  }
})

function ItemPage() {
  const { post, comments } = Route.useLoaderData()
  const { getAccessToken, authenticated, login } = usePrivy();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!authenticated) {
        login();
        return;
    }

    const form = e.currentTarget;
    const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value;
    if (!content) return;

    setSubmitting(true);
    try {
        const token = await getAccessToken();
        if (!token) throw new Error("No token");

        await submitComment({
            data: {
                postId: post.id,
                content,
                authToken: token
            }
        });
        
        form.reset();
        router.invalidate();
    } catch (e) {
        console.error(e);
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div className="bg-background min-h-screen pt-2 px-2 md:px-4">
       <PostItem post={post} index={0} />
       
       {post.text && (
         <div className="pl-4 md:pl-9 mt-4 text-[13px] max-w-4xl text-black">
            {post.text}
         </div>
       )}

       <div className="mt-8 px-1 md:pl-4">
         <form onSubmit={handleSubmit} className="mb-8">
            <textarea name="content" rows={6} className="w-full max-w-xl border border-gray-300 p-2 text-sm mb-2" disabled={submitting} />
            <br />
            <button type="submit" disabled={submitting} className="bg-background border border-gray-400 px-4 py-1 font-medium text-black hover:border-black rounded-sm text-xs">
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
