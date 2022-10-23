import {
  ThunkAction,
  Action,
  combineReducers,
  createStore,
  applyMiddleware,
} from '@reduxjs/toolkit'
import { createWrapper } from 'next-redux-wrapper'
import { resultSlice } from './resultSlice'
import { persistReducer, persistStore } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import thunk from 'redux-thunk'
import { advisorSlice } from './advisorSlice'

const reducers = combineReducers({
  [resultSlice.name]: resultSlice.reducer,
  [advisorSlice.name]: advisorSlice.reducer,
})

const bindMiddleware = (middleware: any) => {
  // if (process.env.NODE_ENV !== 'production') {
  //   const { composeWithDevTools } = require('redux-devtools-extension');
  //   return composeWithDevTools(applyMiddleware(...middleware));
  // }
  return applyMiddleware(...middleware)
}

const makeStore = ({ isServer }: any) => {
  if (isServer) {
    // If it's on server side, create a store
    return createStore(reducers, bindMiddleware([thunk]))
  } else {
    // If it's on client side, create a store which will persist
    const persistConfig = {
      key: 'nextjs',
      storage, // if needed, use a safer storage, localStorage is used atm
    }

    const persistedReducer = persistReducer(persistConfig, reducers) // Create a new reducer with our existing reducer

    const store = createStore(persistedReducer, bindMiddleware([thunk])) // Creating the store again

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    store._persist = persistStore(store) // This creates a persistor object & push that persisted object to .__persistor, so that we can avail the persistability feature

    return store
  }
}

export type AppStore = ReturnType<typeof makeStore>
export type AppState = ReturnType<AppStore['getState']>
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, AppState, unknown, Action>

export const wrapper = createWrapper<AppStore>(makeStore, { debug: true })
