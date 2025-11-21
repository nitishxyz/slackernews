import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { usePrivy } from '@privy-io/react-auth'
import { useState } from 'react'
import { submitPost } from '../server/posts'
import { useAuthToken } from '../hooks/useAuthToken'

export const Route = createFileRoute('/submit')({
  component: SubmitPage,
})

function SubmitPage() {
  const { authenticated } = usePrivy()
  const navigate = useNavigate()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { token, loading: tokenLoading } = useAuthToken()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const url = formData.get('url') as string
    const content = formData.get('text') as string

    if (!authenticated) {
      setError("Please login first")
      setLoading(false)
      return
    }

    if (!token || tokenLoading) {
      setError("Failed to get auth token")
      setLoading(false)
      return
    }

    try {
      const result = await submitPost({ 
        data: {
          title,
          url,
          content,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (result.success) {
        // Invalidate the home page route to force fresh data
        router.invalidate()
        navigate({ to: '/', search: { page: 1, sort: 'new' } })
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to submit post")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-4 px-4 md:px-8">
      {error && <div className="text-red-500 mb-4 text-sm font-bold">{error}</div>}
      <form onSubmit={handleSubmit} className="max-w-xl flex flex-col gap-3 md:gap-4 text-[13px]">
        <div className="flex flex-col md:flex-row md:gap-4 gap-1">
          <label className="md:w-16 font-medium text-[#828282]" htmlFor="title">title</label>
          <input 
            id="title" 
            name="title"
            type="text" 
            required
            className="border border-gray-300 p-1 w-full"
          />
        </div>
        
        <div className="flex flex-col md:flex-row md:gap-4 gap-1">
          <label className="md:w-16 font-medium text-[#828282]" htmlFor="url">url</label>
          <input 
            id="url" 
            name="url"
            type="text" 
            className="border border-gray-300 p-1 w-full"
          />
        </div>

        <div className="flex md:gap-4 gap-1">
          <span className="md:w-16"></span>
          <span className="font-bold">or</span>
        </div>

        <div className="flex flex-col md:flex-row md:gap-4 gap-1">
          <label className="md:w-16 font-medium text-[#828282]" htmlFor="text">text</label>
          <textarea 
            id="text" 
            name="text"
            rows={4}
            className="border border-gray-300 p-1 w-full"
          />
        </div>

        <div className="flex gap-4 mt-2">
          <span className="w-16"></span>
          <button 
            type="submit" 
            disabled={loading || !token || tokenLoading}
            className="bg-background border border-gray-400 px-4 py-1 font-medium text-black hover:border-black rounded-sm disabled:opacity-50"
          >
            {loading ? 'processing...' : 'submit'}
          </button>
        </div>
        
        <div className="flex gap-4 mt-4">
            <span className="w-16"></span>
            <p className="text-[#828282] text-xs">
                Leave url blank to submit a question for discussion. If there is no url, the text (if any) will appear at the top of the thread.
            </p>
        </div>
      </form>
    </div>
  )
}
