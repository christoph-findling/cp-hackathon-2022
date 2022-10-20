// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

abstract contract AssetRiskRateRegistry is Ownable {
    mapping(address => uint32) public assetRiskRates;

    constructor() Ownable() {}

    function defineAssetRiskRate(address asset, uint32 riskRate)
        external
        onlyOwner
    {
        assetRiskRates[asset] = riskRate;
    }

    function assetRiskRate(address asset) external view returns (uint32) {
        return assetRiskRates[asset];
    }
}
