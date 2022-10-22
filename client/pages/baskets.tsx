import { NextPage } from 'next';
import Layout from '../components/layout';
import Image from 'next/image';
import CustomLink from '../components/link';


export interface Basket {
    name: string,
    risk: number,
    logo: string,
    active: boolean,
    matchRate: number
}

const baskets: Basket[] = [
    {
        name: 'testudo basket',
        risk: 50,
        logo: 'icons8-stocks.png',
        matchRate: 100,
        active: true
    },
    {
        name: 'community basket',
        risk: 20,
        logo: 'icons8-people.png',
        matchRate: 65,
        active: false
    },
    {
        name: 'rrrrrisky basket',
        risk: 100,
        logo: 'icons8-fire.png',
        matchRate: 38,
        active: false
    }
]

const checkmarkSVG = () => {
    return (
        <svg width="25" height="25" className="color-white bg-white fill-green-500" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckCircleIcon"><path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm-2 17l-5-5 1.4-1.4 3.6 3.6 7.6-7.6L19 8l-9 9z"></path></svg>
    )
}

const Baskets: NextPage = () => {
    return (
        <Layout>
            <h1 className="text-2xl text-center mb-4">Select a basket</h1>
            {baskets.map((basket, index) => (
                <div className={`flex justify-around items-center border rounded my-2 p-2  ${basket.active ? 'cursor-pointer drop-shadow-lg bg-white' : 'opacity-30 cursor-default'}`} key={`basket_${basket.name}_${index}`}>
                    <div className="w-1/5">
                        <Image width="40" height="40" src={`/icons/${basket.logo}`} />
                    </div>
                    <div className="w-1/5">
                        <span>{basket.name}</span>
                    </div>
                    <div className="w-1/5">
                        <span>Risk: {basket.risk}%</span>
                    </div>
                    <div className="w-1/5">
                        <span><strong>{basket.matchRate}%</strong> match rate</span>
                    </div>
                    <div className="w-1/5 justify-center flex">
                        {basket.active && checkmarkSVG()}
                    </div>
                </div>
            ))}
            <div className="flex justify-end mt-6">
                <CustomLink type="button" title="Continue" href="/portfolio" />
            </div>
        </Layout>
    )
}

export default Baskets;