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
import { ModalUnstyled } from '@mui/base'
import { contractAddresses } from './contract-addresses'

import { ConfettiService } from '../services/confetti-service'

const loadingSvg = `<div style="display: flex; justify-content: center; align-items: center; width: 250px; height: 100px;"><svg aria-hidden="true" class="mr-2 w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
<path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
</svg></div>`

let basketSdk: any = null

const Portfolio: NextPage = () => {
	const resultState: Result = useSelector(selectResultState)
	const [initState, setInitState] = useState(false)
	const [modalOpenState, setModalOpenState] = useState(false)
	const [assetAmounts, setAssetAmounts] = useState([])
	const prevResultRef = useRef()
	const dispatch = useDispatch()
	const { data: signer, isError, isLoading } = useSigner()

	const getAssetDistribution = async () => {
		if (!signer) {
			return
		}
		setInitState(true)
		basketSdk = new BasketDemoSdk()
		basketSdk.init(signer as Signer)
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
		// token 2: aUSDC, 5%, default weight -> 6 decimals
		// token 3: aWBTC, 10%, double weight -> 8 decimals
		// token 4: aWETH, 20%, triple weight
		// token 5: dpi, 40%, default weight
		// token 6: mvi, 65%, default weight
		// token 7: ionx, 80%, double weight

		console.log(
			`for user risk rate of ${userRiskRate}%`,
			amounts.map((x: any) => x.toNumber() / 1e6),
		)

		const assetsObject: any = {}
		const mappedAssets = ['PAXG', 'aUSDC', 'aWBTC', 'aWETH', 'DPI', 'MVI', 'IONX'].map(
			(asset, i) => {
				const percentage: number = (amounts[i].toNumber() / 1e6 / inputAmount) * 100
				assetsObject[asset] = parseInt(percentage.toFixed(2))
				return { [asset]: percentage }
			},
		)
		// const totalPercentage = amounts.reduce((prev, x) => (prev += x.toNumber() / 1e6), 0)

		const result: Result = {
			...resultState,
			riskTolerance: userRiskRate,
			assets: assetsObject,
		}

		dispatch(setResultState(result))
	}

	if (signer && !initState) {
		getAssetDistribution()
	}

	const createBasket = async () => {
		const inputAmount = 1000
		// const result = await basketSdk.swapAndApprove(
		// 	(resultState as any).svg,
		// 	contractAddresses.basketBuilder,
		// 	basketSdk.usdc,
		// 	inputAmount * 1e6,
		// 	resultState.riskTolerance * 1e6,
		// )
		setModalOpenState(true)
		const result = await basketSdk.swapAndBuild(
			(resultState as any).svg,
			contractAddresses.basketBuilder,
			basketSdk.usdc,
			inputAmount * 1e6,
			resultState.riskTolerance * 1e6,
		)
		// console.log('swapAndBuild result', result)
		dispatch(setResultState({ metadataUri: result.metadataUri, token: result.token }))
		// dispatch(setResultState({ metadataUri: 'https://bafyreiaedwuoezl32elsqdinqil5ayauhowcectk7geis3f7awp2euyore.ipfs.dweb.link/metadata.json', token: 'token token 123' }));
		success()
	}

	const selectionChanged = (result: Result) => {
		console.log(result)
		dispatch(setResultState(result))
	}

	// Get asset distribution if riskTolerance slider has changed
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		if (
			prevResultRef?.current &&
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			prevResultRef.current.riskTolerance != resultState.riskTolerance
		) {
			getAssetDistribution()
		}

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		prevResultRef.current = resultState
	}, [resultState])

	const success = () => {
		setModalOpenState(false)
		const confettiService = new ConfettiService()
		confettiService.confettiCannon()
	}

	const getAssetAmounts = async () => {
		basketSdk = new BasketDemoSdk()
		basketSdk.init(signer as Signer)
		const [assets, assetAmounts] = await basketSdk.getBasketAssetAmounts(
			contractAddresses.basketManager,
			(resultState as any)?.token,
		)

		const assetNames = Object.keys(resultState.assets)
		console.log(assetAmounts)
		const result = assetAmounts.map((x, index) => ({
			name: assetNames[index],
			amount: x?.toString(),
		}))
		setAssetAmounts(result)
	}

	return (
		<Layout>
			<div className='w-full flex items-center justify-center'>
				<div className='w-3/5'>
					{!resultState?.metadataUri?.length && (
						<>
							<div>
								<h1 className='text-lg italic mb-2'>
									Recommended asset distribution, based on your answers:
								</h1>
							</div>
							<div className='p-5 mb-5 border rounded-lg shadow-lg shadow-slate-100'>
								{!!resultState?.assets && !!Object.keys(resultState?.assets).length && (
									<AssetSelector selectionChanged={selectionChanged} interactive={false} />
								)}
								{(!resultState?.assets || !Object.keys(resultState?.assets).length) && (
									<div
										className='flex items-center justify-center'
										dangerouslySetInnerHTML={{ __html: loadingSvg }}
									></div>
								)}
							</div>
							<div className='w-full flex justify-between items-center'>
								<CustomLink href='/advisor' title='Back to advisor' type='button' />
								<a onClick={() => createBasket()}>
									<CustomButton title='Confirm & Create portfolio' />
								</a>
							</div>
							<ModalUnstyled
								aria-labelledby='transition-modal-title'
								aria-describedby='transition-modal-description'
								open={modalOpenState}
								componentsProps={{
									root: {
										className:
											'inset-0 bg-slate-500/50 flex fixed w-full h-full inset-0 items-center justify-center',
									},
								}}
							>
								<div className='p-5 px-10 bg-white border rounded flex flex-col items-center justify-center'>
									<h2 className='text-lg mt-5' id='transition-modal-title'>
										Creating your portfolio basket
									</h2>
									<span id='transition-modal-description' style={{ marginTop: '16px' }}>
										Please be patient, this might take a few minutes...
									</span>
									<div dangerouslySetInnerHTML={{ __html: loadingSvg }} />
								</div>
							</ModalUnstyled>
						</>
					)}
					{!!resultState.metadataUri?.length && (
						<div className=''>
							<div className='mb-8 break-words'>
								<h1 className='mb-0 text-center'>🎉 We did it, congrats! 🎉</h1>
								<h1 className='text-2xl mb-10'>Your portfolio has been created successfully</h1>
								<div className='p-5 mb-5 border rounded-lg shadow-lg shadow-slate-100'>
									<div className='flex items-center justify-around pt-2'>
										<span className='text-xl'>
											<strong>{resultState?.amount} USDC </strong>invested at a{' '}
											<strong>{resultState?.riskTolerance}%</strong> Risk rate
										</span>
										{/* <span className="text-xl">{resultState?.riskTolerance}% Risk rate</span> */}
									</div>
									<div
										className='flex items-center justify-center my-5'
										dangerouslySetInnerHTML={{ __html: resultState?.svg }}
									/>
									<div>
										<span className='text-xl'>Metadata URI: </span>
										<CustomLink
											className='text-lg cursor-pointer'
											href={resultState?.metadataUri}
											title={resultState?.metadataUri}
										/>
									</div>
									<div className='mt-10'>
										<span className='text-xl'>TokenId:</span>
										<br />
										<span className='text-lg'>{resultState?.token}</span>
									</div>
									<br />
									{assetAmounts &&
										assetAmounts.map((asset) => (
											<div key={`${asset.name}_${asset.amount}`}>
												<span>
													{asset.name}: {asset.amount}
												</span>
											</div>
										))}
									<br />
									<div className='flex items-center justify-center'>
										<CustomButton onClick={() => getAssetAmounts()} title='Get asset amounts' />
									</div>
								</div>
							</div>
							<div className='flex items-center justify-center'>
								<CustomLink type='button' href='/' title='Create another portfolio' />
							</div>
						</div>
					)}
				</div>
			</div>
		</Layout>
	)
}

export default Portfolio
