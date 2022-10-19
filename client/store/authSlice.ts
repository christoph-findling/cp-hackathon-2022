import { createSlice } from '@reduxjs/toolkit';
import { AppState } from './store';
import { HYDRATE } from 'next-redux-wrapper';

export interface AuthState {
    loggedIn: boolean
}

const initialState: AuthState =  {
    loggedIn: false
}

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuthState(state, action) {
            console.log('set auth state');
            console.log(state);
            console.log(action.payload);
            state.loggedIn = action.payload;
            return state;
        },
    },
        extraReducers: {
            [HYDRATE]: (state, action) => {
                console.log('hydrate auth');
                console.log(action.payload);
              return {
                ...state,
                ...action.payload,
              };
            },
          },
});

  export const { setAuthState } = authSlice.actions;
  
  export const selectAuthState = (state: AppState) => state.auth.loggedIn;
  
  export default authSlice.reducer;

