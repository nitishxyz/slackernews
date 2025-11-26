import { createFileRoute, useRouter } from '@tanstack/react-router'
import { PostItem } from '../components/PostItem'
import { CommentItem, CommentProps } from '../components/CommentItem'
import { fetchPost } from '../server/posts'
import { submitComment } from '../server/comments'
import { timeAgo } from '../lib/utils'
import { usePrivy } from '@privy-io/react-auth'
import { useState } from 'react'
import { useAuthToken } from '../hooks/useAuthToken'

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
        text: c.content,
        totalChildren: 0 // Initialize count
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

    // Third pass: Calculate recursive descendant counts
    // We can do this with a simple DFS post-order traversal logic
    const calculateTotalChildren = (node: any): number => {
        if (!node.children || node.children.length === 0) {
            node.totalChildren = 0;
            return 0;
        }
        
        let sum = 0;
        for (const child of node.children) {
            // count the child itself + its children
            sum += 1 + calculateTotalChildren(child);
        }
        
        node.totalChildren = sum;
        return sum;
    };

    roots.forEach(root => calculateTotalChildren(root));

    return { 
      post: {
        id: post.id,
        title: post.title,
        url: post.url,
        score: post.score,
        by: post.by,
        time: timeAgo(post.createdAt),
        descendants: post.commentCount,
        text: post.content,
        userUpvoted: post.userUpvoted,
      },
      comments: roots as CommentProps[]
    }
  }
})

function ItemPage() {
  const { post, comments } = Route.useLoaderData()
  const { authenticated, login } = usePrivy();
  const { token, loading: tokenLoading } = useAuthToken();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [optimisticComments, setOptimisticComments] = useState<CommentProps[]>([]);

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
        if (!token || tokenLoading) {
          throw new Error("No identity token");
        }

        const result = await submitComment({
            data: {
                postId: post.id,
                content,
            },
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        
        form.reset();

        if (result.success && result.comment) {
            const newComment: CommentProps = {
                id: result.comment.id,
                by: result.username,
                time: "just now",
                text: result.comment.content,
                score: 1,
                userUpvoted: true,
                postId: result.comment.postId,
                parentId: null,
                children: [],
                totalChildren: 0
            };
            setOptimisticComments(prev => [newComment, ...prev]);
        }

        router.invalidate();
    } catch (e) {
        console.error(e);
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f6f6ef] pt-2 px-2 md:px-4">
       <PostItem post={post} index={0} />
       
       {post.text && (
         <div className="pl-4 md:pl-9 mt-4 text-[13px] max-w-4xl text-black">
            {post.text}
         </div>
       )}

       <div className="mt-8 px-1 md:pl-4">
         <form onSubmit={handleSubmit} className="mb-8">
            <textarea name="content" rows={6} className="w-full max-w-xl border border-gray-300 p-2 text-sm mb-2 disabled:opacity-50" disabled={submitting} />
            <br />
            <button type="submit" disabled={submitting} className="bg-background border border-gray-400 px-4 py-1 font-medium text-black hover:border-black rounded-sm text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? 'adding comment...' : 'add comment'}
            </button>
         </form>

         {optimisticComments.filter(opt => !comments.some(c => c.id === opt.id)).map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
         ))}

         {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
         ))}
       </div>
    </div>
  )
}
