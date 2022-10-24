import '../styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'

import type { AppProps } from 'next/app'
import { useStore } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { wrapper } from '../store/store'

import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public'
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { configureChains, chain, createClient, WagmiConfig, Chain } from 'wagmi'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'

function MyApp({ Component, pageProps }: AppProps) {
  const localChain: Chain = {
    id: 137,
    name: 'LocalPolygonChain',
    network: 'localhost 8545',
    nativeCurrency: {
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: 'http://127.0.0.1:8545',
    },
    // blockExplorers: {
    //   default: { name: 'SnowTrace', url: 'https://snowtrace.io' },
    // },
    testnet: true,
  }

  // const { chains, provider } = configureChains(
  const { chains, provider } = configureChains(
    [localChain],
    // [ alchemyProvider({ apiKey: 'dDEHfJFvReWVH3JNKtyzSi2B6UX_fWVG' })    ]
    [
      jsonRpcProvider({
        rpc: (chain) => {
          if (chain.id !== localChain.id) return null
          return { http: chain.rpcUrls.default }
        },
      }),
    ],
  )

  const { connectors } = getDefaultWallets({
    appName: 'My RainbowKit App',
    chains,
  })

  const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider,
  })

  const store = useStore()

  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <PersistGate loading={null} persistor={store._persist}>
      <WagmiConfig client={wagmiClient}>
        <RainbowKitProvider chains={chains}>
          <Component {...pageProps}></Component>
        </RainbowKitProvider>
      </WagmiConfig>
    </PersistGate>
  )
}

export default wrapper.withRedux(MyApp)
