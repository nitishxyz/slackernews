import { Link } from '@tanstack/react-router'
import { usePrivy } from '@privy-io/react-auth'

export default function Header() {
  const { login, logout, authenticated, user } = usePrivy()

  const navLinks = [
    { name: 'new', to: '/new' },
    { name: 'threads', to: '/threads' },
    { name: 'comments', to: '/comments' },
    { name: 'show', to: '/show' },
    { name: 'ask', to: '/ask' },
    { name: 'jobs', to: '/jobs' },
    { name: 'submit', to: '/submit' },
  ]

  return (
    <header className="bg-[#4c1d95] text-white p-1 flex items-center text-[13px] leading-tight">
      <Link to="/" className="font-bold border border-white mr-2 px-1 py-0.5 text-white">
        SN
      </Link>
      <Link to="/" className="font-bold mr-4 hover:underline">
        SlackerNews
      </Link>
      
      <nav className="flex gap-2">
        {navLinks.map((link, index) => (
          <div key={link.name} className="flex items-center">
            {index > 0 && <span className="mr-2">|</span>}
            <Link 
              to={link.to}
              className="hover:underline"
              activeProps={{ className: 'text-white' }}
            >
              {link.name}
            </Link>
          </div>
        ))}
      </nav>
      
      <div className="ml-auto mr-2">
        {authenticated ? (
          <button type="button" onClick={logout} className="hover:underline">
            logout ({user?.email?.address?.split('@')[0] || user?.wallet?.address?.slice(0, 6) || 'user'})
          </button>
        ) : (
          <button type="button" onClick={login} className="hover:underline">login</button>
        )}
      </div>
    </header>
  )
}
