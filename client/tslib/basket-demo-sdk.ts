import { erc20ABI, useProvider } from 'wagmi'
import { BigNumber, ethers, Signer, utils } from 'ethers'
import { stringify } from 'query-string'
import { NFTStorage } from 'nft.storage'
import axios from 'axios'

/* eslint-disable camelcase */
import { IBasketBlueprintRegistry__factory } from '../contract-types/factories/IBasketBlueprintRegistry__factory'
import { IBasketManager__factory } from '../contract-types/factories/IBasketManager__factory'
import { IBasketBuilder__factory } from '../contract-types/factories/IBasketBuilder__factory'
import { NFT_STORAGE_API_KEY } from './nft-storage-api-key'
const zeroXApiHTTP = 'https://polygon.api.0x.org'

export class BasketDemoSdk {
  public readonly defaultBasketBlueprintName = utils.formatBytes32String('DiversifiedBasket')
	public readonly usdc = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
  
	public signer: Signer | null = null
  
	public init(signer: Signer) {
		this.signer = signer
	}

	public async getOwner() {
		return this._getSigner()
	}

	public async getBasketBlueprintRegistryAt(address: string) {
		return IBasketBlueprintRegistry__factory.connect(address, await this.getOwner())
	}

	public async getBasketManagerAt(address: string) {
		return IBasketManager__factory.connect(address, await this.getOwner())
	}

	public async getBasketBuilderAt(address: string) {
		return IBasketBuilder__factory.connect(address, await this.getOwner())
	}

	// get spend amount ratios for each asset in a basketBlueprint
	// can be used to show a graph of asset distribution for a given user risk rate
	public async getSpendAmounts(
		basketBuilderAddress: string,
		// userRiskRate should be between 1 and 100_000_000.
		// 1% would be 1_000_000. 10% 10_000_000 etc.
		userRiskRate: number,
		// amounts are aligned to a given inputAmount, e.g. 1000 USDC if the user wants to
		// invest a total of 1000 USDC. Could be an arbitrary number if just ratios are wanted
		// remember decimals here, e.g. usdc has 6 decimals so 1 USDC = 1_000_000
		inputAmount: number,
	) {
		const basketBuilder = await this.getBasketBuilderAt(basketBuilderAddress)

		return basketBuilder.callStatic.getSpendAmounts(
			this.defaultBasketBlueprintName,
			userRiskRate,
			inputAmount,
		)
	}

	public async swapAndBuild(
		nftImageSvgString: string,
		basketBuilderAddress: string,
		inputToken: string,
		// total amount that the user wants to spend (e.g. 1000 USDC)
		// remember decimals here, e.g. usdc has 6 decimals so 1 USDC = 1_000_000
		maxAmountInputToken: number,
		// userRiskRate should be between 1 and 100_000_000.
		// 1% would be 1_000_000. 10% 10_000_000 etc.
		userRiskRate: number,
		// optional unlock date
		unlockDate?: Date,
		// optional different receiver than BasketDemoSdk.getOwner().address
		receiver?: string,
	) {
		const ownerAddress = await (await this.getOwner()).getAddress()
		if (!receiver) {
			receiver = ownerAddress
		}
		const usdcERC20 = new ethers.Contract(this.usdc, erc20ABI, await this.getOwner())

		const ownerInputTokenBalance = await usdcERC20.balanceOf(ownerAddress)
		console.log('balance of owner of inputToken:', ownerInputTokenBalance.toString())
		// check balance
		if (ownerInputTokenBalance < maxAmountInputToken) {
			await this._swap0x(
				'MATIC',
				inputToken,
				BigNumber.from(0),
				BigNumber.from(maxAmountInputToken),
			)

			console.log('swap executed!')
		}

		// check allowance
		const ownerInputTokenAllowance = await usdcERC20.allowance(ownerAddress, basketBuilderAddress)
		if (ownerInputTokenAllowance < maxAmountInputToken * 100) {
			// multiplier just for quicker testing...
			await usdcERC20.approve(basketBuilderAddress, maxAmountInputToken, {
				gasLimit: 10000000,
				gasPrice: 1600000000000,
			})
			console.log('allowance executed!')
		}

		const basketBuilder = await this.getBasketBuilderAt(basketBuilderAddress)

		const swapQuotes = await this.get0xQuotes(
			basketBuilderAddress,
			inputToken,
			userRiskRate,
			maxAmountInputToken,
		)

		let unlockBlock = 0
		if (unlockDate) {
			unlockBlock = await this.estimateBlockNumberAtDate(unlockDate) // unlockDate to unlockBlock
		}

		const nftMetadataUri = await this._storeNFTMetadata(
			this.defaultBasketBlueprintName,
			nftImageSvgString,
			userRiskRate,
			unlockBlock,
		)

		const tx = await basketBuilder.swapAndBuild(
			inputToken,
			maxAmountInputToken,
			swapQuotes,
			this.defaultBasketBlueprintName,
			receiver,
			userRiskRate,
			nftMetadataUri,
			unlockBlock,
			{
				gasLimit: 10000000,
				gasPrice: 1600000000000,
			},
		)

		const receipt = await tx.wait()
		console.log('swapAndBuild tx result: ', receipt)
		console.log('swapAndBuild tx gas used: ', receipt.gasUsed.toString())
		return receipt
	}

	public async getBasketAssetAmounts(basketManagerAddress: string, tokenId: number) {
		const basketManager = await this.getBasketManagerAt(basketManagerAddress)

		return await basketManager.callStatic.getBasketAssetAmounts(tokenId)
	}

	// gets the 0x protocol swap quotes
	public async get0xQuotes(
		basketBuilderAddress: string,
		inputToken: string,
		userRiskRate: number,
		inputAmount: number,
	) {
		const [assets, spendAmounts] = await this.getSpendAmounts(
			basketBuilderAddress,
			userRiskRate,
			inputAmount,
		)

		const quotes: any[] = []

		for (let i = 0; i < spendAmounts.length; i++) {
			// for each basket asset get the 0x quote from input token -> basket asset
			const quote = await this._get0XQuote(inputToken, assets[i], spendAmounts[i])
			quotes.push(quote)
		}
		console.log('0x quotes fetched!')
		return quotes
	}

	public async estimateBlockNumberAtDate(date: Date) {
		const provider = this._getProvider()
		// get average block time
		const currentBlockNumber = await provider.getBlockNumber()
		const currentBlockTime = (await provider.getBlock(currentBlockNumber)).timestamp
		const pastBlockTime = (await provider.getBlock(currentBlockNumber - 10000)).timestamp
		const avgBlockTimeInSeconds = (currentBlockTime - pastBlockTime) / 10000

		const dateDifferenceInSeconds = (date.getTime() - new Date().getTime()) / 1000

		const blocksUntilDate = dateDifferenceInSeconds / avgBlockTimeInSeconds

		return currentBlockNumber + blocksUntilDate
	}

	private async _swap0x(
		sellToken: string,
		buyToken: string,
		sellAmount?: BigNumber,
		buyAmount?: BigNumber,
	) {
		if (buyToken === sellToken) {
			return
		}

		const params: any = {
			sellToken,
			buyToken,
		}

		if (sellAmount?.toNumber() !== 0) {
			params.sellAmount = sellAmount
		} else if (buyAmount?.toNumber() !== 0) {
			params.buyAmount = buyAmount
		} else {
			throw new Error('NOT IMPLEMENTED')
		}

		const response = await axios.get(`${zeroXApiHTTP}/swap/v1/quote?${stringify(params)}`)
		const res = response.data

		if (sellToken !== 'MATIC') {
			throw new Error('NOT IMPLEMENTED. WOULD HAVE TO APPROVE FIRST')
		}

		const result = (await this.getOwner()).sendTransaction({
			to: res.to,
			data: res.data,
			gasPrice: 1600000000000,
			gasLimit: 10000000,
			value: res.value,
		})

		const end = await result

		return await end.wait()
	}

	private async _get0XQuote(sellToken: string, buyToken: string, sellAmount: BigNumber) {
		if (buyToken === sellToken) {
			return '0x'
		}
		const params = {
			sellToken,
			buyToken,
			sellAmount,
		}

		const response = await axios.get(`${zeroXApiHTTP}/swap/v1/quote?${stringify(params)}`)
		const res = response.data?.data

		return res
	}

	private async _storeNFTMetadata(
		basketBlueprintName: string,
		svgString: string,
		userRiskRate: number,
		unlockBlock: number,
	): Promise<string> {
		const client = new NFTStorage({ token: NFT_STORAGE_API_KEY })
		const imageBlob = new Blob([svgString], { type: 'image/svg+xml' })
		const metadata = await client.store({
			name: 'PortfolioBasket',
			description: 'Sample Portfolio Basket for Testudo Charged Particles Hackathon 2022',
			image: imageBlob,
			properties: {
				riskRate: userRiskRate,
				basketBlueprintName,
				unlockBlock,
			},
		})
		console.log('Metadata stored on Filecoin and IPFS with URL:', metadata.url)

		return metadata.url
	}

	private _getSigner() {
		return this.signer as Signer
	}

	private _getProvider() {
		return useProvider()
	}
}
