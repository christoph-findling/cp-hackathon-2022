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

import { ConfettiService } from '../services/confetti-service';

const loadingSvg = `<div style="display: flex; justify-content: center; align-items: center; width: 250px; height: 100px;"><svg aria-hidden="true" class="mr-2 w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
<path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
</svg></div>`

const Portfolio: NextPage = () => {
	const resultState: Result = useSelector(selectResultState)
	const [initState, setInitState] = useState(false);
	const [modalOpenState, setModalOpenState] = useState(false);
	const prevResultRef = useRef();
	const dispatch = useDispatch();
	const { data: signer, isError, isLoading } = useSigner()

	const getAssetDistribution = async () => {
		if (!signer) {
			return;
		}
		setInitState(true);
		const basket = new BasketDemoSdk()
		basket.init(signer as Signer)
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const userRiskRate = resultState.riskTolerance
		const inputAmount = resultState.amount

		const [assets, amounts] = await basket.getSpendAmounts(
			'0x9853Eb1dc3946F78f043EA513Ed87ADBdA6eeE09',
			resultState.riskTolerance * 1e6,
			inputAmount * 1e6,
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

		const assetsObject: any = {}
		const mappedAssets = ['gold', 'usdc', 'webtc', 'weth', 'dpi', 'mvi', 'ionx'].map((asset, i) => {
			const percentage: number = (amounts[i].toNumber() / 1e6 / inputAmount) * 100
			assetsObject[asset] = parseInt(percentage.toFixed(2))
			return { [asset]: percentage }
		})
		const totalPercentage = amounts.reduce((prev, x) => (prev += x.toNumber() / 1e6), 0)

		const result: Result = {
			...resultState,
			riskTolerance: userRiskRate,
			assets: assetsObject,
		}
		console.log(result)
		dispatch(setResultState(result))
	}

	if (signer && !initState) {
		getAssetDistribution();
	}

	const selectionChanged = (result: Result) => {
		dispatch(setResultState(result))
	}

	// Get asset distribution if riskTolerance slider has changed
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		if (
			(prevResultRef?.current &&
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				prevResultRef.current.riskTolerance != resultState.riskTolerance)
		) {
			getAssetDistribution()
		}

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		prevResultRef.current = resultState
	}, [resultState])

	const success = () => {
		setModalOpenState(false);
		const confettiService = new ConfettiService();
		confettiService.confettiCannon();
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
						{(!!resultState?.assets && !!Object.keys(resultState?.assets).length) && (
							<AssetSelector
								selectionChanged={selectionChanged}
								interactive={false}
							/>
						)}
						{(!resultState?.assets || !Object.keys(resultState?.assets).length) &&
							(<div className="flex items-center justify-center" dangerouslySetInnerHTML={{ __html: loadingSvg }} >
							</div>)
						}
					</div>
					<div className='w-full flex justify-between items-center'>
						<CustomLink href='/advisor' title='Back to advisor' type='button' />
						<a onClick={() => setModalOpenState(true)}>
							<CustomButton title='Confirm & Create portfolio' />
						</a>
					</div>
					<ModalUnstyled
						aria-labelledby="transition-modal-title"
						aria-describedby="transition-modal-description"
						open={modalOpenState}
						componentsProps={{root: {className: 'inset-0 bg-slate-500/50 flex fixed w-full h-full inset-0 items-center justify-center'}}}
					>
							<div className="p-5 px-10 bg-white border rounded flex flex-col items-center justify-center">
								<span className="border p-2 cursor-pointer" onClick={() => success()}>X</span>
								<h2 className="text-lg mt-5" id="transition-modal-title">Creating your portfolio basket</h2>
								<span id="transition-modal-description" style={{ marginTop: '16px' }}>
									Please be patient...
								</span>
								<div dangerouslySetInnerHTML={{ __html: loadingSvg }} />
							</div>
					</ModalUnstyled>
				</div>
			</div>
		</Layout>
	)
}

export default Portfolio
