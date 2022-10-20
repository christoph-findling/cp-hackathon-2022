import type { NextPage } from 'next'
import { useState } from 'react';
import CustomButton from '../components/button';
import Layout from '../components/layout';
import AssetSelector from '../components/slider';

export interface Answer {
    answer: string,
    points: number
}

export interface Step {
    title: string,
    question: string,
    answers: Answer[],
    active: boolean,
    selected: number | null
}

const preSelected = true;

const initialStepsState: Step[] = [
    {
        title: 'Question one',
        question: 'I am mostly invested in...',
        answers: [
            { answer: 'real estate', points: 0 },
            { answer: 'crypto', points: 50 },
            { answer: 'stocks', points: 35 },
            { answer: 'collectibles (art, classic cars, etc.)', points: 15 },
            { answer: 'a mix of two or more of the above', points: 25 },
        ],
        active: true,
        selected: preSelected ? 0 : null
    },
    {
        title: 'Question two',
        question: 'I worry about my investment decisions.',
        answers: [
            { answer: 'all the time', points: 0 },
            { answer: 'regularly', points: 10 },
            { answer: 'sometimes', points: 25 },
            { answer: 'rarely', points: 35 },
            { answer: 'never', points: 50 },
        ],
        active: false,
        selected: preSelected ? 0 : null
    },
    {
        title: 'Question three',
        question: 'I have made investment decisions in the past that I regret.',
        answers: [
            { answer: 'yes, many', points: 0 },
            { answer: 'yes, a few', points: 15 },
            { answer: 'yes, one', points: 25 },
            { answer: 'not quite sure', points: 35 },
            { answer: 'no, never', points: 50 },
        ], active: false,
        selected: preSelected ? 0 : null
    },
    {
        title: 'Question four',
        question: 'Last question.',
        answers: [
            { answer: 'yes', points: 0 },
            { answer: 'yes, but no', points: 15 },
            { answer: 'yes, and no', points: 25 },
            { answer: 'not quite sure', points: 35 },
            { answer: 'no', points: 50 },
        ], active: false,
        selected: preSelected ? 0 : null
    },
]

const checkmarkSVG = (fill?: string) => {
    return (
        <svg className={`color-white bg-white ${fill ? fill : 'fill-blue-500'}`} focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckCircleIcon"><path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm-2 17l-5-5 1.4-1.4 3.6 3.6 7.6-7.6L19 8l-9 9z"></path></svg>
    )
}

const Advisor: NextPage = () => {

    const [stepsState, setStepsState] = useState(JSON.parse(JSON.stringify(initialStepsState)) as Step[]);
    const [activeStep, setActiveStepState] = useState(0);
    const [finishedQuestions, setFinishedQuestionsState] = useState(false);

    const tabChanged = (val: number) => {
        const newState = [...stepsState];
        newState.forEach((_, index) => newState[index].active = false);
        newState[val].active = true;
        setActiveStepState(val);
        setStepsState(newState);
    }

    const answerSelected = (step: number, answer: number) => {
        const newState = [...stepsState];
        newState[step].selected = answer;
        setStepsState(newState);
        setTimeout(() => {
            goToNextStep();
        }, 200);
    }

    const showContinueButton = () => {
        return stepsState.every((step: Step) => step.selected != null);
    }

    const activateNextButton = () => {
        return !stepsState[stepsState.length - 1].active && !showContinueButton();
    }

    const activatePreviousButton = () => {
        return !stepsState[0].active && !showContinueButton();
    }

    const activateResetButton = () => {
        return stepsState.filter((step: Step) => step?.selected != null).length > 0;
    }

    const resetState = () => {
        setStepsState(JSON.parse(JSON.stringify(initialStepsState)) as Step[]);
        setActiveStepState(0);
        setFinishedQuestionsState(false)
    }

    const goToNextStep = () => {
        const newState = [...stepsState];
        let currentActiveStep = 0;
        newState.find((el, i) => el.active ? currentActiveStep = i : '');
        if (currentActiveStep < newState.length - 1) {
            newState.forEach((_, index) => newState[index].active = false);
            newState[currentActiveStep + 1].active = true;
            setStepsState(newState);
            setActiveStepState(currentActiveStep + 1);
        }
    }

    const goToPreviousStep = () => {
        const newState = [...stepsState];
        let currentActiveStep = 0;
        newState.find((el, i) => el.active ? currentActiveStep = i : '');
        if (currentActiveStep != 0) {
            newState.forEach((_, index) => newState[index].active = false);
            newState[currentActiveStep - 1].active = true;
            setStepsState(newState);
            setActiveStepState(currentActiveStep - 1);
        }
    }

    const getQuestion = () => {
        const step = stepsState[activeStep];
        const index = activeStep;
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

    const getResult = () => {
        return { risky: 30, mid: 30, stable: 40 };
    }

    return (
        <Layout>
            {!finishedQuestions &&
                <div>
                    <div className="mb-8">
                        <div className="flex justify-between">
                            {stepsState.map((step: Step, index: number) => (
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
                                <CustomButton title="Continue" />
                            </a>
                        }
                        {!showContinueButton() &&
                            <a className="ml-2" onClick={() => activatePreviousButton() ? goToPreviousStep() : ''}>
                                <CustomButton title="Previous" disabled={!activatePreviousButton()} />
                            </a>
                        }
                        {!showContinueButton() &&
                            <a className="ml-2" onClick={() => activateNextButton() ? goToNextStep() : ''}>
                                <CustomButton title="Next" disabled={!activateNextButton()} />
                            </a>
                        }
                    </div>
                </div>
            }
            {finishedQuestions &&
                <div className="w-full flex items-center justify-center">
                    <div className='w-3/5'>
                        <div>
                            <h1 className="text-lg italic mb-2">Recommended asset distribution, based on your answers:</h1>
                        </div>
                        <div className="p-5 mb-5 border rounded-lg shadow-lg shadow-slate-100">
                            <AssetSelector input={getResult()} />
                        </div>
                        <div className="w-full flex justify-between items-center">
                            <a className="" onClick={() => setFinishedQuestionsState(false)}>
                                <CustomButton title="Back to advisor" />
                            </a>
                            <a className="" onClick={() => console.log('continue')}>
                                <CustomButton title="Continue" />
                            </a>
                        </div>
                    </div>
                </div>
            }
        </Layout>
    )
}

export default Advisor;