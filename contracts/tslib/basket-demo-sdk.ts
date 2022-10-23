import "@nomiclabs/hardhat-ethers";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { stringify } from "query-string";

const hre = require("hardhat");

import { IBasketBlueprintRegistry__factory } from "../types/ethers-contracts/factories/IBasketBlueprintRegistry__factory";
import { IBasketManager__factory } from "../types/ethers-contracts/factories/IBasketManager__factory";
import { IBasketBuilder__factory } from "../types/ethers-contracts/factories/IBasketBuilder__factory";
import { IERC20__factory } from "../types/ethers-contracts/factories/IERC20__factory";

export class BasketDemoSdk {
    public readonly defaultBasketBlueprintName = "DEFAULT";
    public readonly usdc = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

    // give the default account some usdc for swapping
    public async init() {
        const usdcWhale = "0x06959153b974d0d5fdfd87d561db6d8d4fa0bb0b";

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [usdcWhale],
        });

        const usdcWhaleSigner = await ethers.getSigner(usdcWhale);
        const owner = await this.getOwner();

        // transfer 1MM USDC to owner
        await IERC20__factory.connect(this.usdc, usdcWhaleSigner).transfer(
            owner.address,
            1000000 * 1e6
        );
    }

    public async getOwner() {
        const provider = await ethers.getSigners();
        return provider[0];
    }

    public async getBasketBlueprintRegistryAt(address: string) {
        return IBasketBlueprintRegistry__factory.connect(
            address,
            await this.getOwner()
        );
    }

    public async getBasketManagerAt(address: string) {
        return IBasketManager__factory.connect(address, await this.getOwner());
    }

    public async getBasketBuilderAt(address: string) {
        return IBasketBuilder__factory.connect(address, await this.getOwner());
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
        inputAmount: number
    ) {
        const basketBuilder = await this.getBasketBuilderAt(
            basketBuilderAddress
        );

        return basketBuilder.callStatic.getSpendAmounts(
            this.defaultBasketBlueprintName,
            userRiskRate,
            inputAmount
        );
    }

    public async swapAndBuild(
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
        receiver?: string
    ) {
        if (!receiver) {
            receiver = (await this.getOwner()).address;
        }

        const basketBuilder = await this.getBasketBuilderAt(
            basketBuilderAddress
        );

        const swapQuotes = await this.get0xQuotes(
            basketBuilderAddress,
            inputToken,
            userRiskRate,
            maxAmountInputToken
        );

        let unlockBlock = 0;
        if (!!unlockDate) {
            unlockBlock = await this.estimateBlockNumberAtDate(unlockDate); // unlockDate to unlockBlock
        }

        return basketBuilder.swapAndBuild(
            inputToken,
            maxAmountInputToken,
            swapQuotes,
            this.defaultBasketBlueprintName,
            receiver,
            userRiskRate,
            unlockBlock
        );
    }

    // gets the 0x protocol swap quotes
    public async get0xQuotes(
        basketBuilderAddress: string,
        inputToken: string,
        userRiskRate: number,
        inputAmount: number
    ) {
        let spendAmounts: BigNumber[];
        let assets: string[];
        [assets, spendAmounts] = await this.getSpendAmounts(
            basketBuilderAddress,
            userRiskRate,
            inputAmount
        );

        const quotes: any[] = [];

        for (let i = 0; i < spendAmounts.length; i++) {
            // for each basket asset get the 0x quote from input token -> basket asset
            quotes.push(
                await this.get0XQuote(inputToken, assets[i], spendAmounts[i])
            );
        }

        return quotes;
    }

    public async estimateBlockNumberAtDate(date: Date) {
        // get average block time
        const currentBlockNumber = await ethers.provider.getBlockNumber();
        const currentBlockTime = (
            await ethers.provider.getBlock(currentBlockNumber)
        ).timestamp;
        const pastBlockTime = (
            await ethers.provider.getBlock(currentBlockNumber - 10000)
        ).timestamp;
        const avgBlockTimeInSeconds =
            (currentBlockTime - pastBlockTime) / 10000;

        const dateDifferenceInSeconds =
            (date.getTime() - new Date().getTime()) / 1000;

        const blocksUntilDate = dateDifferenceInSeconds / avgBlockTimeInSeconds;

        return currentBlockNumber + blocksUntilDate;
    }

    private async get0XQuote(
        sellToken: string,
        buyToken: string,
        sellAmount: BigNumber
    ) {
        const params = {
            sellToken,
            buyToken,
            sellAmount,
        };

        return await fetch(
            `https://polygon.api.0x.org/swap/v1/quote?${stringify(params)}`
        );
    }
}
