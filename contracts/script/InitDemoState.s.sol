// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import "forge-std/Script.sol";
import {IBasketManager} from "../src/interfaces/IBasketManager.sol";
import {IBasketManager} from "../src/interfaces/IBasketManager.sol";
import {IBasketBlueprintRegistry} from "../src/interfaces/IBasketBlueprintRegistry.sol";

contract InitDemoState is Script {
    function run() external {
        vm.startBroadcast();

        vm.stopBroadcast();
    }
}
