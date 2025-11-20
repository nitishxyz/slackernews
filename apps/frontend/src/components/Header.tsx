import { Link } from '@tanstack/react-router'
import { usePrivy } from '@privy-io/react-auth'

export default function Header() {
  const { login, logout, authenticated, user, ready } = usePrivy()

  const username = 
    user?.github?.username ||
    user?.google?.name ||
    user?.twitter?.username ||
    user?.discord?.username ||
    user?.email?.address?.split('@')[0] ||
    `user_${user?.id?.slice(0, 8) || 'anon'}`

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
    <header className="bg-[#4c1d95] text-white p-0.5 flex items-center text-[10pt] leading-tight">
      <Link to="/" className="font-bold border border-white mr-1 px-1.5 py-0.5 text-white bg-[#4c1d95] ml-0.5">
        SN
      </Link>
      <Link to="/" className="font-bold mr-2 hover:underline text-white">
        SlackerNews
      </Link>
      
      <nav className="flex gap-1 text-white">
        {navLinks.map((link, index) => (
          <div key={link.name} className="flex items-center">
            <span className="mx-1">|</span>
            <Link 
              to={link.to}
              className="hover:underline text-white"
              activeProps={{ className: 'font-bold' }}
            >
              {link.name}
            </Link>
          </div>
        ))}
      </nav>
      
      <div className="ml-auto mr-1 text-white">
        {!ready ? (
          <span>loading...</span>
        ) : authenticated ? (
          <div className="flex items-center gap-2">
            <Link to={`/user/${username}`} className="hover:underline text-white">
              {username}
            </Link>
            <span>|</span>
            <button type="button" onClick={logout} className="hover:underline text-white">logout</button>
          </div>
        ) : (
          <button type="button" onClick={login} className="hover:underline text-white">login</button>
        )}
      </div>
    </header>
  )
}
