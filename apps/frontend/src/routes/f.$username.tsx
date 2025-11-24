import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { PostItem } from '../components/PostItem'
import { fetchUserFavorites } from '../server/posts'
import { timeAgo } from '../lib/utils'
import { z } from 'zod'

const FavoritesSearchSchema = z.object({
  page: z.number().default(1).catch(1),
})

export const Route = createFileRoute('/f/$username')({
  validateSearch: (search) => FavoritesSearchSchema.parse(search),
  loaderDeps: ({ search: { page } }) => ({ page }),
  loader: async ({ deps, params }) => {
    const { page } = deps;
    const username = params.username;
    const { posts, hasMore } = await fetchUserFavorites({ data: { username, page, limit: 30 } })
    return { 
      favoritePosts: posts.map(p => ({
        id: p.id,
        title: p.title,
        url: p.url,
        score: p.score,
        by: p.by,
        time: timeAgo(p.createdAt),
        descendants: p.commentCount,
        userUpvoted: p.userUpvoted
      })),
      hasMore,
      page,
      username
    }
  },
  component: FavoritesPage,
})

function FavoritesPage() {
  const { favoritePosts, hasMore, page, username } = Route.useLoaderData()
  const navigate = useNavigate()

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
        {favoritePosts.map((post, i) => (
          <PostItem key={post.id} post={post} index={(page - 1) * 30 + i + 1} />
        ))}
      </div>
      <div className="ml-9 mt-4 text-[13px]">
        {page > 1 && (
          <Link 
            to="/f/$username" 
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
            to="/f/$username" 
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

