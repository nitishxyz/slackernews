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

  const navLinks: { name: string, to: string }[] = [
    { name: 'new', to: '/new' },
    { name: 'comments', to: '/comments' },
    { name: 'show', to: '/show' },
    { name: 'submit', to: '/submit' },
  ]

  return (
    <header className="bg-[#4c1d95] text-white p-1 md:p-0.5 flex flex-wrap items-center text-[10pt] leading-tight gap-1 md:gap-0">
      <Link to="/" className="font-bold border border-white mr-1 px-1.5 py-0.5 text-white bg-[#4c1d95] shrink-0 order-1">
        SN
      </Link>
      <Link to="/" className="font-bold mr-2 hover:underline text-white shrink-0 order-2">
        Slacker News
      </Link>
      
      <nav className="flex flex-wrap gap-1 text-white items-center order-4 w-full md:w-auto md:flex-1 md:order-3 mt-1 md:mt-0">
        {navLinks.map((link, index) => (
          <div key={link.name} className="flex items-center whitespace-nowrap">
            <span className={`mx-1 ${index === 0 ? 'hidden md:inline' : ''}`}>|</span>
            <Link 
              to={link.to}
              className="hover:underline text-white px-1 md:px-0"
              activeProps={{ className: 'font-bold' }}
            >
              {link.name}
            </Link>
          </div>
        ))}
      </nav>
      
      <div className="ml-auto mr-1 text-white shrink-0 pl-2 order-3 md:order-4">
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
