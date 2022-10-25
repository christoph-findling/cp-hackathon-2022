import { NextPage } from 'next'
import { useDispatch, useSelector } from 'react-redux'
import CustomButton from '../components/button'
import Layout from '../components/layout'
import CustomLink from '../components/link'
import AssetSelector from '../components/slider'
import { selectResultState, setResultState } from '../store/resultSlice'

import { BasketDemoSdk } from '../tslib/basket-demo-sdk'
import { useSigner } from 'wagmi'
import { Signer } from 'ethers'
import { Result } from './advisor'
import { useEffect, useRef, useState } from 'react'
import { contractAddresses } from './contract-addresses'

const Portfolio: NextPage = () => {
	const resultState = useSelector(selectResultState)
	const [loadingState, setLoadingState] = useState(true)
	const prevResultRef = useRef()
	const dispatch = useDispatch()
	console.log('result state: ', resultState)

	const { data: signer, isError, isLoading } = useSigner()

	const doThing = async () => {
		setLoadingState(true)
		const basketSdk = new BasketDemoSdk()
		basketSdk.init(signer as Signer)
		console.log(resultState)
		console.log('val ', basketSdk.defaultBasketBlueprintName)
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const userRiskRate = resultState.riskTolerance
		const inputAmount = 10000
		const [assets, amounts] = await basketSdk.getSpendAmounts(
			contractAddresses.basketBuilder,
			resultState.riskTolerance * 1e6,
			inputAmount * 1e6,
		)
		// default basket assets
		// token 1: gold PAXG, 1%, default weight
		// token 2: aUSDC, 5%, default weight
		// token 3: aWBTC, 10%, double weight
		// token 4: aWETH, 20%, triple weight
		// token 5: dpi, 40%, default weight
		// token 6: mvi, 65%, default weight
		// token 7: ionx, 80%, double weight

		console.log(
			`for user risk rate of ${userRiskRate}%`,
			amounts.map((x) => x.toNumber() / 1e6),
		)

		const assetsObject: any = {}
		const mappedAssets = ['gold', 'usdc', 'webtc', 'weth', 'dpi', 'mvi', 'ionx'].map((asset, i) => {
			const percentage: number = (amounts[i].toNumber() / 1e6 / inputAmount) * 100
			assetsObject[asset] = parseInt(percentage.toFixed(2))
			return { [asset]: percentage }
		})
		const total = amounts.reduce((prev, x) => (prev += x.toNumber() / 1e6), 0)

		const result: Result = {
			riskTolerance: userRiskRate,
			assets: assetsObject,
		}

		dispatch(setResultState(result))
		console.log(result)
		setLoadingState(false)
	}

	const selectionChanged = (result: Result) => {
		dispatch(setResultState(JSON.parse(JSON.stringify(result))))
		console.log(result)
	}

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		if (
			prevResultRef?.current &&
			prevResultRef.current.riskTolerance != resultState.riskTolerance
		) {
			console.log('DO SC REQ')
			doThing()
		}
		console.log(prevResultRef)
		console.log(resultState)
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		prevResultRef.current = resultState
	}, [resultState])

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
						{resultState?.assets && (
							<AssetSelector
								selectionChanged={selectionChanged}
								interactive={true}
								input={resultState}
							/>
						)}
					</div>
					<div className='w-full flex justify-between items-center'>
						<CustomLink href='/advisor' title='Back to advisor' type='button' />
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
