import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/submit')({
  component: SubmitPage,
})

function SubmitPage() {
  return (
    <div className="pt-4 px-8">
      <form className="max-w-xl flex flex-col gap-4 text-[13px]">
        <div className="flex gap-4">
          <label className="w-16 font-medium text-[#828282]" htmlFor="title">title</label>
          <input 
            id="title" 
            type="text" 
            className="border border-gray-300 p-1 w-full"
          />
        </div>
        
        <div className="flex gap-4">
          <label className="w-16 font-medium text-[#828282]" htmlFor="url">url</label>
          <input 
            id="url" 
            type="text" 
            className="border border-gray-300 p-1 w-full"
          />
        </div>

        <div className="flex gap-4">
          <span className="w-16"></span>
          <span className="font-bold">or</span>
        </div>

        <div className="flex gap-4">
          <label className="w-16 font-medium text-[#828282]" htmlFor="text">text</label>
          <textarea 
            id="text" 
            rows={4}
            className="border border-gray-300 p-1 w-full"
          />
        </div>

        <div className="flex gap-4 mt-2">
          <span className="w-16"></span>
          <button 
            type="submit" 
            className="bg-background border border-gray-400 px-4 py-1 font-medium text-black hover:border-black rounded-sm"
          >
            submit
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
