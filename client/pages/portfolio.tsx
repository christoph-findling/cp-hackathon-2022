import { NextPage } from 'next';
import { useSelector } from 'react-redux';
import CustomButton from '../components/button';
import Layout from '../components/layout';
import CustomLink from '../components/link';
import AssetSelector from '../components/slider';
import { selectResultState } from '../store/resultSlice';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import {BasketDemoSdk} from '../tslib/basket-demo-sdk';


const Portfolio: NextPage = () => {
    const resultState = useSelector(selectResultState);
    console.log('result state: ', resultState)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    BasketDemoSdk.init();

    return (
        <Layout>
            <div className="w-full flex items-center justify-center">
                <div className='w-3/5'>
                    <div>
                        <h1 className="text-lg italic mb-2">Recommended asset distribution, based on your answers:</h1>
                    </div>
                    <div className="p-5 mb-5 border rounded-lg shadow-lg shadow-slate-100">
                        <AssetSelector input={resultState} />
                    </div>
                    <div className="w-full flex justify-between items-center">
                        <CustomLink href="/advisor" title="Back to advisor" type="button" />
                        <ConnectButton />                               
                        <a><CustomButton title="Init" /></a>
                    </div>
                </div>
            </div>
        </Layout>
    )
}

export default Portfolio;