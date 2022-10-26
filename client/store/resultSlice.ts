import { createSlice } from '@reduxjs/toolkit';
import { AppState } from './store';
import { HYDRATE } from 'next-redux-wrapper';
import { Result } from '../pages/advisor';

export interface ResultState {
    resultState: Result
}

const initialState: ResultState =  {
    resultState: {
      assets: {},
      riskTolerance: 0,
      amount: 0
    }
}

export const resultSlice = createSlice({
    name: 'result',
    initialState,
    reducers: {
        setResultState(state, action) {
            console.log('set result state');
            state.resultState = {...state.resultState, ...action.payload};
            return state;
        },
    },
        extraReducers: {
            [HYDRATE]: (state, action) => {
                console.log('hydrate result state');
              return {
                ...state,
                ...action.payload,
              };
            },
          },
});

  export const { setResultState } = resultSlice.actions;
  
  export const selectResultState = (state: AppState) => state.result.resultState;
  
  export default resultSlice.reducer;

