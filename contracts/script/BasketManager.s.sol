// SPDX-License-Identifier: No License
pragma solidity ^0.8.7;

import "forge-std/Script.sol";
import {BasketManager} from "../src/BasketManager.sol";

contract DeployBasketManager is Script {
    function run() external {
        vm.startBroadcast();

        new BasketManager();

        vm.stopBroadcast();
    }
}
