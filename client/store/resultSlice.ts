import { createSlice } from '@reduxjs/toolkit';
import { AppState } from './store';
import { HYDRATE } from 'next-redux-wrapper';
import { Result } from '../pages/advisor';

export interface ResultState {
    resultState: Result
}

const initialState: ResultState =  {
    resultState: {
      risky: 0,
      mid: 0,
      stable: 0,
      riskTolerance: 0
    }
}

export const resultSlice = createSlice({
    name: 'result',
    initialState,
    reducers: {
        setResultState(state, action) {
            console.log('set result state');
            console.log(state);
            console.log(action.payload);
            state.resultState = {...state, ...action.payload};
            console.log(state)
            return state;
        },
    },
        extraReducers: {
            [HYDRATE]: (state, action) => {
                console.log('hydrate result state');
                console.log(action.payload);
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

