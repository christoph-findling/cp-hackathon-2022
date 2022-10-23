import { Question } from '../pages/advisor';

const preSelected = false;

export const stepsCount = 4;

export const  initialQuestionsState: Question[] = [
    {
        title: 'Question one',
        question: 'I am mostly invested in...',
        answers: [
            { answer: 'real estate', points: 0 },
            { answer: 'crypto', points: 100 },
            { answer: 'stocks', points: 50 },
            { answer: 'collectibles (art, classic cars, etc.)', points: 25 },
            { answer: 'a mix of two or more of the above', points: 20 },
        ],
        active: true,
        selected: preSelected ? 0 : null
    },
    {
        title: 'Question two',
        question: 'I worry about my investment decisions.',
        answers: [
            { answer: 'all the time', points: 0 },
            { answer: 'regularly', points: 25 },
            { answer: 'sometimes', points: 50 },
            { answer: 'rarely', points: 75 },
            { answer: 'never', points: 100 },
        ],
        active: false,
        selected: preSelected ? 0 : null
    },
    {
        title: 'Question three',
        question: 'I have made investment decisions in the past that I regret.',
        answers: [
            { answer: 'yes, many', points: 0 },
            { answer: 'yes, a few', points: 30 },
            { answer: 'yes, one', points: 50 },
            { answer: 'not quite sure', points: 70 },
            { answer: 'no, never', points: 100 },
        ], active: false,
        selected: preSelected ? 0 : null
    },
    {
        title: 'Question four',
        question: 'Last question.',
        answers: [
            { answer: 'yes', points: 0 },
            { answer: 'yes, but no', points: 30 },
            { answer: 'yes, and no', points: 50 },
            { answer: 'not quite sure', points: 70 },
            { answer: 'no', points: 100 },
        ], active: false,
        selected: preSelected ? 0 : null
    },
]