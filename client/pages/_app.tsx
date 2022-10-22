import '../styles/globals.css'
import type { AppProps } from 'next/app'
import {  useStore } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react';
import { wrapper } from '../store/store';

function MyApp({ Component, pageProps }: AppProps) {
const store = useStore();

return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <PersistGate loading={null} persistor={store._persist} >
      <Component {...pageProps}></Component>
    </PersistGate>
  )
}

export default wrapper.withRedux(MyApp)
