// SPDX-License-Identifier: No License
pragma solidity ^0.8.7;

import "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {BasketBlueprintRegistry} from "../src/BasketBlueprintRegistry.sol";
import {BasketManager} from "../src/BasketManager.sol";
import {BasketBuilder} from "../src/BasketBuilder.sol";
import {IProtonB} from "../src/external/charged-particles/IProtonB.sol";
import {IChargedParticles} from "../src/external/charged-particles/IChargedParticles.sol";

import {IBasketBuilder} from "../src/interfaces/IBasketBuilder.sol";
import {IBasketManager} from "../src/interfaces/IBasketManager.sol";
import {IBasketBlueprintRegistry} from "../src/interfaces/IBasketBlueprintRegistry.sol";

import "forge-std/console.sol";

contract InitDemoState is Script {
    address public constant paxg = 0x553d3D295e0f695B9228246232eDF400ed3560B5;
    address public constant usdc = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174;
    address public constant wbtc = 0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6;
    address public constant weth = 0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619;
    address public constant dpi = 0x85955046DF4668e1DD369D2DE9f3AEB98DD2A369;
    address public constant mvi = 0xfe712251173A2cd5F5bE2B46Bb528328EA3565E1;
    address public constant ionx = 0x01b317bC5eD573FAa112eF64DD029F407CecB155;

    function run() external {
        vm.startBroadcast();

        BasketBlueprintRegistry basketBlueprintRegistry = new BasketBlueprintRegistry();

        console.log(
            "\n\n  BasketBlueprintRegistry deployed at: ",
            address(basketBlueprintRegistry)
        );

        BasketManager basketManager = new BasketManager();

        console.log("BasketManager deployed at: ", address(basketManager));

        IBasketBuilder basketBuilder = new BasketBuilder(
            basketBlueprintRegistry,
            basketManager,
            IProtonB(0x1CeFb0E1EC36c7971bed1D64291fc16a145F35DC), // proton B on Polygon
            IChargedParticles(0x660De54CEA09838d11Df0812E2754eD8D08CD2f7), // chargedParticles on Polygon
            0xDef1C0ded9bec7F1a1670819833240f027b25EfF // 0x SwapTarget -> "ExchangeProxy" on Polygon
        );

        console.log("BasketBuilder deployed at: ", address(basketBuilder));

        bytes32 defaultbasketBlueprintName = "DiversifiedBasket";
        address defaultOwner = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

        IBasketBlueprintRegistry.BasketAsset[]
            memory assets = _getDefaultAssets();

        basketBlueprintRegistry.defineBasketBlueprint(
            defaultbasketBlueprintName,
            assets,
            defaultOwner
        );

        console.log(
            "Default basket blueprint defined. \n\n------------------------------------\n\n"
        );
        vm.stopBroadcast();

        // give the default account at [0] some usdc for swapping
        address usdcWhale = 0x06959153B974D0D5fDfd87D561db6d8d4FA0bb0B;
        vm.prank(usdcWhale);

        // transfer 1MM USDC to owner
        IERC20(usdc).transfer(defaultOwner, 6_000_000 * 1e6);
    }

    function _getDefaultAssets()
        internal
        pure
        returns (IBasketBlueprintRegistry.BasketAsset[] memory assets)
    {
        assets = new IBasketBlueprintRegistry.BasketAsset[](7);
        assets[0] = IBasketBlueprintRegistry.BasketAsset(
            IERC20(paxg),
            1_000_000, // riskRate -> 1%
            0 // weight. 0 will set to default (10_000_000)
        );
        assets[1] = IBasketBlueprintRegistry.BasketAsset(
            IERC20(usdc),
            5_000_000, // riskRate -> 5%
            0 // weight. 0 will set to default (10_000_000)
        );
        assets[2] = IBasketBlueprintRegistry.BasketAsset(
            IERC20(wbtc),
            10_000_000, // riskRate -> 10%
            20_000_000 // weight. double the default weight (10_000_000)
        );
        assets[3] = IBasketBlueprintRegistry.BasketAsset(
            IERC20(weth),
            20_000_000, // riskRate -> 20%
            30_000_000 // weight. triple the default weight (10_000_000)
        );
        assets[4] = IBasketBlueprintRegistry.BasketAsset(
            IERC20(dpi),
            40_000_000, // riskRate -> 40%
            0 // weight. 0 will set to default (10_000_000)
        );
        assets[5] = IBasketBlueprintRegistry.BasketAsset(
            IERC20(mvi),
            70_000_000, // riskRate -> 65%
            0 // weight. 0 will set to default (10_000_000)
        );
        assets[6] = IBasketBlueprintRegistry.BasketAsset(
            IERC20(ionx),
            80_000_000, // riskRate -> 80%
            20_000_000 // weight. double the default weight (10_000_000)
        );
    }
}
