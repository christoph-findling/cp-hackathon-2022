// SPDX-License-Identifier: No License
pragma solidity ^0.8.7;

import "forge-std/Script.sol";
import {BasketManager} from "../src/BasketManager.sol";
import {BasketBlueprintRegistry} from "../src/BasketBlueprintRegistry.sol";
import {IProtonB} from "../src/external/charged-particles/IProtonB.sol";
import {IChargedParticles} from "../src/external/charged-particles/IChargedParticles.sol";

contract DeployBasketManager is Script {
    function run() external {
        vm.startBroadcast();

        BasketBlueprintRegistry basketBlueprintRegistry = new BasketBlueprintRegistry();

        console.log(
            "BasketBlueprintRegistry deployed at: ",
            address(basketBlueprintRegistry)
        );

        new BasketManager(
            basketBlueprintRegistry,
            IProtonB(0x1CeFb0E1EC36c7971bed1D64291fc16a145F35DC), // proton B on Polygon
            IChargedParticles(0x0288280Df6221E7e9f23c1BB398c820ae0Aa6c10) // chargedParticles on Polygon
        );

        vm.stopBroadcast();
    }
}
