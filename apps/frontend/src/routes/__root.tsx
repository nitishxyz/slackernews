import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { PrivyProvider } from '@privy-io/react-auth'
import { getPrivyAppId } from '../server/env'
import { AuthSync } from '../components/AuthSync'

import Header from '../components/Header'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import StoreDevtools from '../lib/demo-store-devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  loader: () => getPrivyAppId().then(id => ({ privyAppId: id })),
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'SlackerNews',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { privyAppId } = Route.useLoaderData()

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground">
        <PrivyProvider
          appId={privyAppId}
          config={{
            loginMethods: ['email', 'wallet', 'google', 'twitter', 'discord', 'github'],
            // embeddedWallets: {
            //   createOnLogin: 'users-without-wallets',
            // },
          }}
        >
        <div className="md:w-[85%] w-full mx-auto bg-[#f6f6ef]">
          <Header />
          <main className="py-2">{children}</main>
        </div>
        <AuthSync />
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
            StoreDevtools,
          ]}
        />
        </PrivyProvider>
        <Scripts />
      </body>
    </html>
  )
}
