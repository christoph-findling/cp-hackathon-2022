import type { NextPage } from 'next'
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CustomButton from '../components/button';
import Layout from '../components/layout';
import CustomLink from '../components/link';
import { selectAdvisorState, setAdvisorState } from '../store/advisorSlice';
import { initialQuestionsState, stepsCount } from '../store/questions';
import { setResultState } from '../store/resultSlice';

export interface Answer {
    answer: string,
    points: number
}

export interface Question {
    title: string,
    question: string,
    answers: Answer[],
    active: boolean,
    selected: number | null
}

export interface Result {
    risky: number,
    mid: number,
    stable: number,
    riskTolerance: number
}

const checkmarkSVG = (fill?: string) => {
    return (
        <svg className={`color-white bg-white ${fill ? fill : 'fill-blue-500'}`} focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckCircleIcon"><path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm-2 17l-5-5 1.4-1.4 3.6 3.6 7.6-7.6L19 8l-9 9z"></path></svg>
    )
}

const Advisor: NextPage = () => {
    const stepsState = useSelector(selectAdvisorState)
    const dispatch = useDispatch()

    let activeQuestionInit = 0;
    stepsState.forEach((step, i) => {
        if (step.active) {
            activeQuestionInit = i;
        }
    })
    const [activeQuestion, setActiveQuestionState] = useState(activeQuestionInit);
    const [riskTolerance, setRiskTolerance] = useState(0);
    const [finishedQuestions, setFinishedQuestionsState] = useState(false);

    const tabChanged = (val: number) => {
        const newState = [...JSON.parse(JSON.stringify(stepsState))];
        newState.forEach((_, index) => newState[index].active = false);
        newState[val].active = true;
        setActiveQuestionState(val);
        setQuestionsState(newState);
    }

    const setQuestionsState = (steps: Question[]) => {
        dispatch(setAdvisorState(steps));
    }

    const answerSelected = (step: number, answer: number) => {
        const newState = [...JSON.parse(JSON.stringify(stepsState))];
        newState[step].selected = answer;
        setQuestionsState(newState);
        setTimeout(() => {
            goToNextQuestion(newState);
        }, 250);
    }

    // Each time a checkbox is clicked, re-calculate the risk tolerance
    useEffect(() => {
        calculateRiskTolerance();
        console.log('EFFECT')
    }, [stepsState])
    
    useEffect(() => {
        console.log('risktolerance ,', riskTolerance)
        dispatch(setResultState({ risky: 30, mid: 30, stable: 40, riskTolerance }))
    }, [riskTolerance])

    const showContinueButton = () => {
        return stepsState.every((step: Question) => step.selected != null);
    }

    const activateNextButton = () => {
        return !stepsState[stepsState.length - 1].active && !showContinueButton();
    }

    const activatePreviousButton = () => {
        return !stepsState[0].active && !showContinueButton();
    }

    const activateResetButton = () => {
        return stepsState.filter((step: Question) => step?.selected != null).length > 0;
    }

    const calculateRiskTolerance = () => {
        let riskTolerance = 0;
        stepsState.forEach((step) => {
            if (!step?.selected) return;
            riskTolerance += step.answers[step.selected].points / stepsCount;
        })

        setRiskTolerance(riskTolerance);
    }

    const resetState = () => {
        setQuestionsState(JSON.parse(JSON.stringify(initialQuestionsState)) as Question[]);
        setActiveQuestionState(0);
        setFinishedQuestionsState(false)
    }

    const goToNextQuestion = (newState?: Question[]) => {
        let state = [...JSON.parse(JSON.stringify(stepsState))];
        if (newState) state = [...JSON.parse(JSON.stringify(newState))];
        let currentActiveQuestion = 0;
        state.find((el, i) => el.active ? currentActiveQuestion = i : '');
        if (currentActiveQuestion < state.length - 1) {
            state.forEach((_, index) => state[index].active = false);
            state[currentActiveQuestion + 1].active = true;
            setQuestionsState(state);
            setActiveQuestionState(currentActiveQuestion + 1);
        }
    }

    const goToPreviousQuestion = () => {
        const newState = [...JSON.parse(JSON.stringify(stepsState))];
        let currentActiveQuestion = 0;
        newState.find((el, i) => el.active ? currentActiveQuestion = i : '');
        if (currentActiveQuestion != 0) {
            newState.forEach((_, index) => newState[index].active = false);
            newState[currentActiveQuestion - 1].active = true;
            setQuestionsState(newState);
            setActiveQuestionState(currentActiveQuestion - 1);
        }
    }

    const getQuestion = () => {
        const step = stepsState[activeQuestion];
        const index = activeQuestion;
        return (
            <div key={`question_${step.title}_${index}`} className={`mt-5 rounded shadow-lg shadow-slate-100 p-5 border ${index}`}>
                <p className='text-lg italic'>{step.question}</p>
                {step.answers.map((answer, i) => (
                    <div key={`question_${index}_answer_${i}`} className="flex items-center mt-2 mb-2">
                        <input onChange={() => answerSelected(index, i)} checked={i == step.selected} type="checkbox" value="" className="cursor-pointer w-5 h-5 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                        <label onClick={() => answerSelected(index, i)} htmlFor="checked-checkbox" className="ml-2 font-medium text-gray-900 dark:text-gray-300 text-base cursor-pointer">{answer.answer}</label>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <Layout>
            {!finishedQuestions &&
                <div>
                    <div className="mb-8">
                        <div className="flex justify-between">
                            {stepsState.map((step: Question, index: number) => (
                                <div key={`${step.title}_${index}_div`} className={`${index != 0 ? 'w-full' : 'w-auto'} flex flex-row`}>
                                    {index != 0 &&
                                        <div key={`${step.title}_${index}_hr`} className="w-full">
                                            <hr className="m-5 " />
                                        </div>
                                    }
                                    <button className="flex flex-col justify-center items-center text-sm leading-tight" key={`${step.title}_${index}`} onClick={() => tabChanged(index)}>
                                        <div className={`text-blue mb-2 w-10 h-10 rounded-full flex items-center justify-center ${step.active ? 'bg-blue-800 text-white' : 'bg-white border border-slate-300'}`}>
                                            {step?.selected != null ? checkmarkSVG(step.active ? 'fill-blue-800' : '') : index + 1}
                                        </div>{step.title}
                                    </button>
                                </div>
                            ))}
                        </div>
                        {getQuestion()}
                    </div>
                    <div className="w-full flex justify-center relative">
                        <a className="absolute left-0" onClick={() => { activateResetButton() ? resetState() : '' }}>
                            <CustomButton title="Reset" disabled={!activateResetButton()} />
                        </a>
                        {showContinueButton() &&
                            <a onClick={() => { setFinishedQuestionsState(true) }}>
                                <CustomLink href="/baskets" title="Continue" type="button" />
                            </a>
                        }
                        {!showContinueButton() &&
                            <a className="ml-2" onClick={() => activatePreviousButton() ? goToPreviousQuestion() : ''}>
                                <CustomButton title="Previous" disabled={!activatePreviousButton()} />
                            </a>
                        }
                        {!showContinueButton() &&
                            <a className="ml-2" onClick={() => activateNextButton() ? goToNextQuestion() : ''}>
                                <CustomButton title="Next" disabled={!activateNextButton()} />
                            </a>
                        }
                    </div>
                </div>
            }
        </Layout>
    )
}

export default Advisor;