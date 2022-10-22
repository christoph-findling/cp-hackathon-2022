// SPDX-License-Identifier: No License
pragma solidity >=0.8.17;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

abstract contract AssetRiskRateRegistry is Ownable {
    struct AssetRiskRate {
        address asset;
        uint32 riskRate;
    }

    mapping(address => uint32) public assetRiskRates;

    event AssetRiskRateDefined(address asset, uint32 riskRate);

    // solhint-disable-next-line no-empty-blocks
    constructor() Ownable() {}

    function defineAssetRiskRates(AssetRiskRate[] calldata _assetRiskRates)
        external
        onlyOwner
    {
        for (uint256 i = 0; i < _assetRiskRates.length; ++i) {
            assetRiskRates[_assetRiskRates[i].asset] = _assetRiskRates[i]
                .riskRate;

            emit AssetRiskRateDefined(
                _assetRiskRates[i].asset,
                _assetRiskRates[i].riskRate
            );
        }
    }

    function assetRiskRate(address asset) external view returns (uint32) {
        return assetRiskRates[asset];
    }
}
