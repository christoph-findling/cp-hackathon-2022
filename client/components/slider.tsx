import * as React from 'react';
import { useEffect, useState } from 'react';
import { SliderUnstyled } from '@mui/base';

function valueText(value: number) {
    return `${value}%`;
}

const compPropsRiskTolerance = (interactive: boolean) => {
    return {
        thumb: { className: 'w-auto px-1 ring-blue-500 dark:ring-blue-400 ring-2 h-6 -mt-2 text-sm -ml-2 flex items-center justify-center bg-white rounded-full shadow absolute' },
        root: { className: `w-full relative inline-block h-2 ${interactive ? 'cursor-pointer' : ''}` },
        rail: { className: 'bg-slate-100 dark:bg-slate-700 h-2 w-full rounded-full block absolute' },
        track: { className: 'bg-blue-500 dark:bg-blue-400 h-2 absolute rounded-full' }
    }
};

const compProps = (interactive: boolean) => {
    return {
        thumb: { className: 'w-auto px-1 ring-cyan-500 dark:ring-cyan-400 ring-2 h-6 -mt-2 text-sm -ml-2 flex items-center justify-center bg-white rounded-full shadow absolute' },
        root: { className: `w-full relative inline-block h-2 ${interactive ? 'cursor-pointer' : ''}` },
        rail: { className: 'bg-slate-100 dark:bg-slate-700 h-2 w-full rounded-full block absolute' },
        track: { className: 'bg-cyan-500 dark:bg-cyan-400 h-2 absolute rounded-full' }
    }
};

export interface SliderData {
    riskTolerance: number,
    risky: number,
    mid: number,
    stable: number
}

const loadingSvg = `<div style="display: flex; justify-content: center; align-items: center; width: 400px; height: 250px;"><svg aria-hidden="true" class="mr-2 w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
<path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
</svg></div>`;

const AssetSelector = ({ input, selectionStateChanged }: { input?: SliderData, selectionStateChanged?: any }) => {

    const riskTolerance = input?.riskTolerance ? input.riskTolerance : 0;
    const riskyCurrent = input?.risky ? input.risky : 0;
    const midCurrent = input?.mid ? input.mid : 0;
    const stableCurrent = input?.stable ? input.stable : 0;

    const uncontrolledSlider = riskyCurrent > 0 || midCurrent > 0 || stableCurrent > 0 || riskTolerance > 0;

    const [state, setState] = useState({
        riskTolerance: { currentVal: riskTolerance, defaultVal: riskTolerance, maxVal: 100 },
        risky: { currentVal: riskyCurrent, defaultVal: riskyCurrent, maxVal: 100 },
        mid: { currentVal: midCurrent, defaultVal: midCurrent, maxVal: 100 },
        stable: { currentVal: stableCurrent, defaultVal: stableCurrent, maxVal: 100 }
    });
    const [chartState, setChartState] = useState({ chart: loadingSvg });

    const generateChart = () => {
        setChartState({ chart: loadingSvg });
        const reqData = {
            ...(state.riskTolerance.currentVal > 0 && { risky: state.riskTolerance.currentVal }),
            ...(state.risky.currentVal > 0 && { risky: state.risky.currentVal }),
            ...(state.stable.currentVal > 0 && { stable: state.stable.currentVal }),
            ...(state.mid.currentVal > 0 && { mid: state.mid.currentVal }),
        };
        setTimeout(() => {
            fetch('api/generate_chart', { method: 'post', body: JSON.stringify(reqData) })
                .then((res) => res.json())
                .then((data) => {
                    console.log(data);
                    setChartState({ chart: data.res });
                })
        }, 500);
    }

    // Update maxVals each time the slider is moved
    useEffect(() => {
        updateMaxVals();
        selectionStateChanged && selectionStateChanged(false);
    }, [state.risky.currentVal, state.mid.currentVal, state.stable.currentVal]);

    // Update chart on maxVal update => updating maxVal auto updates the currentVal
    // to the correct state matching the new maxVal
    useEffect(() => {
        if ((state.risky.currentVal + state.mid.currentVal + state.stable.currentVal) == 100) {
            generateChart();
            selectionStateChanged && selectionStateChanged(true);
        }
    }, [state.risky.maxVal, state.stable.maxVal, state.mid.maxVal])

    function sliderChanged(val: number, key: string) {
        const newState = { ...state };
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        newState[key as any].currentVal = val;
        setState({ ...newState });
    }

    function updateMaxVals() {
        const newState = {
            ...state,
            mid: {
                ...state.mid,
                maxVal: 100 - state.risky.currentVal - state.stable.currentVal
            },
            risky: {
                ...state.risky,
                maxVal: 100 - state.mid.currentVal - state.stable.currentVal
            },
            stable: {
                ...state.stable,
                maxVal: 100 - state.mid.currentVal - state.risky.currentVal
            },
        }
        setState({ ...newState });
    }

    return (
        <>
            <div className="flex justify-center items-center">
                {chartState.chart != '' &&
                    <div dangerouslySetInnerHTML={{ __html: chartState.chart }} />
                }
            </div>
            <div className='mb-5 pr-7'>
                <p className='mt-2 mb-1'>My risk tolerance</p>
                <SliderUnstyled
                    disabled={uncontrolledSlider}
                    componentsProps={compPropsRiskTolerance(!uncontrolledSlider)}
                    aria-label="Small steps"
                    defaultValue={state.riskTolerance.defaultVal}
                    valueLabelFormat={valueText}
                    getAriaValueText={valueText}
                    step={5}
                    marks
                    min={0}
                    max={state.riskTolerance.maxVal}
                    valueLabelDisplay="on"
                    name="stable"
                    onChangeCommitted={(_, val) => sliderChanged(val as number, 'riskTolerance')}
                />
                <p className='w-full text-center mt-5 font-bold'>Asset distribution</p>
                <p className='mb-1'>Stable</p>
                <SliderUnstyled
                    disabled={uncontrolledSlider}
                    componentsProps={compProps(!uncontrolledSlider)}
                    aria-label="Small steps"
                    defaultValue={state.stable.defaultVal}
                    valueLabelFormat={valueText}
                    getAriaValueText={valueText}
                    step={5}
                    marks
                    min={0}
                    max={state.stable.maxVal}
                    valueLabelDisplay="on"
                    name="stable"
                    onChangeCommitted={(_, val) => sliderChanged(val as number, 'stable')}
                />
                <p className='mt-2 mb-1'>Mid</p>
                <SliderUnstyled
                    disabled={uncontrolledSlider}
                    componentsProps={compProps(!uncontrolledSlider)}
                    aria-label="Small steps"
                    defaultValue={state.mid.defaultVal}
                    valueLabelFormat={valueText}
                    getAriaValueText={valueText}
                    step={5}
                    marks
                    min={0}
                    max={state.mid.maxVal}
                    valueLabelDisplay="on"
                    name="mid"
                    onChangeCommitted={(_, val) => sliderChanged(val as number, 'mid')}
                />
                <p className='mt-2 mb-1'>Risky</p>
                <SliderUnstyled
                    disabled={uncontrolledSlider}
                    componentsProps={compProps(!uncontrolledSlider)}
                    aria-label="Small steps"
                    defaultValue={state.risky.defaultVal}
                    valueLabelFormat={valueText}
                    getAriaValueText={valueText}
                    step={5}
                    marks
                    min={0}
                    max={state.risky.maxVal}
                    valueLabelDisplay="on"
                    name="risky"
                    onChangeCommitted={(_, val) => sliderChanged(val as number, 'risky')}
                />
            </div>
        </>
    );
}

export default AssetSelector;