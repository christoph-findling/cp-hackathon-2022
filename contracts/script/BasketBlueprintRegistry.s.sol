// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "forge-std/Script.sol";
import {BasketBlueprintRegistry} from "../src/BasketBlueprintRegistry.sol";

contract DeployBasketBlueprintRegistry is Script {
    function run() external {
        vm.startBroadcast();

        new BasketBlueprintRegistry();

        vm.stopBroadcast();
    }
}
