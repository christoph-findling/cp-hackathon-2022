import { useSigner, useProvider } from 'wagmi'
import { BigNumber, Signer } from 'ethers'
import { stringify } from 'query-string'
import { NFTStorage } from 'nft.storage'
import dotenv from 'dotenv'
dotenv.config()

/* eslint-disable camelcase */
import { IBasketBlueprintRegistry__factory } from '../contract-types/factories/IBasketBlueprintRegistry__factory'
import { IBasketManager__factory } from '../contract-types/factories/IBasketManager__factory'
import { IBasketBuilder__factory } from '../contract-types/factories/IBasketBuilder__factory'

const NFT_STORAGE_API_KEY = process.env.NFT_STORAGE_API_KEY || ''

export class BasketDemoSdk {
  public readonly defaultBasketBlueprintName = 'DiversifiedBasket'
  public readonly usdc = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'

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
    if (!receiver) {
      receiver = await (await this.getOwner()).getAddress()
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
    )

    console.log('swapAndBuild tx result: ', await tx.wait())
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
      quotes.push(await this._get0XQuote(inputToken, assets[i], spendAmounts[i]))
    }

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

  private async _get0XQuote(sellToken: string, buyToken: string, sellAmount: BigNumber) {
    const params = {
      sellToken,
      buyToken,
      sellAmount,
    }

    return await fetch(`https://polygon.api.0x.org/swap/v1/quote?${stringify(params)}`)
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
    const { data: signer } = useSigner()
    return signer as Signer
  }

  private _getProvider() {
    return useProvider()
  }
}
