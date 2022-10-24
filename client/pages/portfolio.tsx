import { NextPage } from 'next'
import { useSelector } from 'react-redux'
import CustomButton from '../components/button'
import Layout from '../components/layout'
import CustomLink from '../components/link'
import AssetSelector from '../components/slider'
import { selectResultState } from '../store/resultSlice'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { BasketDemoSdk } from '../tslib/basket-demo-sdk'
import { useSigner } from 'wagmi'
import { Signer } from 'ethers'

const Portfolio: NextPage = () => {
	const resultState = useSelector(selectResultState)
	console.log('result state: ', resultState)

	const { data: signer, isError, isLoading } = useSigner()

	const doThing = async () => {
		const basket = new BasketDemoSdk()
		basket.init(signer as Signer)
		console.log('val ', basket.defaultBasketBlueprintName)
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const userRiskRate = 1
		const [assets, amounts] = await basket.getSpendAmounts(
			'0x054Fd1041CE021218B743ABB956Be47903533FC9',
			userRiskRate * 1e6,
			10000 * 1e6,
		)
		// default basket verteilung
		// token 1: gold PAXG, 1%, default weight
		// token 2: usdc, 5%, default weight
		// token 3: wbtc, 10%, double weight
		// token 4: weth, 20%, triple weight
		// token 5: dpi, 40%, default weight
		// token 6: mvi, 65%, default weight
		// token 7: ionx, 80%, double weight

		console.log(
			`for user risk rate of ${userRiskRate}%`,
			amounts.map((x) => x.toNumber() / 1e6),
		)
	}

	return (
		<Layout>
			<div className='w-full flex items-center justify-center'>
				<div className='w-3/5'>
					<div>
						<h1 className='text-lg italic mb-2'>
							Recommended asset distribution, based on your answers:
						</h1>
					</div>
					<div className='p-5 mb-5 border rounded-lg shadow-lg shadow-slate-100'>
						<AssetSelector input={resultState} />
					</div>
					<div className='w-full flex justify-between items-center'>
						<CustomLink href='/advisor' title='Back to advisor' type='button' />
						<ConnectButton />
						<a onClick={() => doThing()}>
							<CustomButton title='Init' />
						</a>
					</div>
				</div>
			</div>
		</Layout>
	)
}

export default Portfolio
