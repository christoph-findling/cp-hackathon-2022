import { createSlice } from '@reduxjs/toolkit';
import { AppState } from './store';
import { HYDRATE } from 'next-redux-wrapper';
import { Question } from '../pages/advisor';
import { initialQuestionsState } from './questions';

export interface AdvisorState {
    advisorState: Question[]
}

const initialState: AdvisorState =  {
    advisorState: initialQuestionsState
}

export const advisorSlice = createSlice({
    name: 'advisor',
    initialState,
    reducers: {
        setAdvisorState(state, action) {
            console.log('set advisor state');
            console.log(state);
            console.log(action.payload);
            state.advisorState = [...action.payload];
            console.log(state.advisorState)
            return state;
        },
    },
        extraReducers: {
            [HYDRATE]: (state, action) => {
                console.log('hydrate advisor state');
                console.log(action.payload);
              return {
                ...state,
                ...action.payload,
              };
            },
          },
});

  export const { setAdvisorState } = advisorSlice.actions;
  
  export const selectAdvisorState = (state: AppState) => state.advisor.advisorState;
  
  export default advisorSlice.reducer;

