// SPDX-License-Identifier: No License
pragma solidity ^0.8.7;

import "forge-std/Script.sol";
import {BasketBlueprintRegistry} from "../src/BasketBlueprintRegistry.sol";
import {BasketManager} from "../src/BasketManager.sol";
import {BasketBuilder} from "../src/BasketBuilder.sol";
import {IProtonB} from "../src/external/charged-particles/IProtonB.sol";
import {IChargedParticles} from "../src/external/charged-particles/IChargedParticles.sol";

import "forge-std/console.sol";

contract DeployBasketBuilder is Script {
    function run() external {
        vm.startBroadcast();

        BasketBlueprintRegistry basketBlueprintRegistry = new BasketBlueprintRegistry();

        console.log(
            "BasketBlueprintRegistry deployed at: ",
            address(basketBlueprintRegistry)
        );

        BasketManager basketManager = new BasketManager();

        console.log("BasketManager deployed at: ", address(basketManager));

        BasketBuilder basketBuilder = new BasketBuilder(
            basketBlueprintRegistry,
            basketManager,
            IProtonB(0x1CeFb0E1EC36c7971bed1D64291fc16a145F35DC), // proton B on Polygon
            IChargedParticles(0x660De54CEA09838d11Df0812E2754eD8D08CD2f7), // chargedParticles on Polygon
            0xDef1C0ded9bec7F1a1670819833240f027b25EfF // 0x SwapTarget -> "ExchangeProxy" on Polygon
        );

        console.log("BasketBuilder deployed at: ", address(basketBuilder));

        vm.stopBroadcast();
    }
}
