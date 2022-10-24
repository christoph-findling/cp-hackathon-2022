import Head from 'next/head'
import Header from './header'

export default function Layout({ children }: any) {
  return (
    <>
      <Head>
        <meta name='viewport' content='initial-scale=1, width=device-width' />
      </Head>
      <div className='container mx-auto mb-10 max-w-4xl'>
        <Header />
        <main className='mt-5'>
          <div className='p-10 pb-3 border border-slate-100 drop-shadow-lg bg-white'>
            {children}
          </div>
        </main>
      </div>
      <div className='fixed bottom-0 w-full'></div>
    </>
  )
}
