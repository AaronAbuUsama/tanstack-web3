import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'

import Header from '../components/layout/Header'
import Web3Provider from '../web3/Web3Provider'
import SafeProvider from '../safe/core/provider'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
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
        title: 'TanStack Web3 - Gnosis Safe Boilerplate',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  component: RootComponent,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootComponent() {
  return (
    <Web3Provider>
      <SafeProvider>
        <Header />
        <Outlet />
      </SafeProvider>
    </Web3Provider>
  )
}
