// SPDX-License-Identifier: No License
pragma solidity >=0.8.17;

import {IBasketBlueprintRegistry} from "./interfaces/IBasketBlueprintRegistry.sol";
import {AssetRiskRateRegistry} from "./AssetRiskRateRegistry.sol";

error BasketBlueprintRegistry__BasketBlueprintNotDefined();
error BasketBlueprintRegistry__Unauthorized();
error BasketBlueprintRegistry__InvalidParams();
error BasketBlueprintRegistry__RiskRateMismatch();

import "forge-std/console.sol";

contract BasketBlueprintRegistry is
    AssetRiskRateRegistry,
    IBasketBlueprintRegistry
{
    uint32 public constant riskRateMaxValue = 100_000_000;
    uint32 public constant defaultWeight = 10_000_000;

    mapping(bytes32 => address) internal _basketBlueprintOwners;
    mapping(bytes32 => BasketAsset[]) internal _basketBlueprintAssets;

    modifier basketBlueprintExists(bytes32 basketBlueprintName) {
        if (!basketBlueprintDefined(basketBlueprintName)) {
            revert BasketBlueprintRegistry__BasketBlueprintNotDefined();
        }
        _;
    }

    modifier onlyBasketBlueprintOwner(bytes32 basketBlueprintName) {
        address _basketBlueprintOwner = basketBlueprintOwner(
            basketBlueprintName
        );

        if (
            _basketBlueprintOwner != address(0) && // must be defined
            _basketBlueprintOwner != msg.sender // and msg.sender must be owner
        ) {
            revert BasketBlueprintRegistry__Unauthorized();
        }
        _;
    }

    // solhint-disable-next-line no-empty-blocks
    constructor() AssetRiskRateRegistry() {}

    function basketBlueprintDefined(bytes32 basketBlueprintName)
        public
        view
        returns (bool)
    {
        return basketBlueprintOwner(basketBlueprintName) != address(0);
    }

    function basketBlueprintOwner(bytes32 basketBlueprintName)
        public
        view
        returns (address)
    {
        return _basketBlueprintOwners[basketBlueprintName];
    }

    function basketBlueprintAssets(bytes32 basketBlueprintName)
        public
        view
        returns (BasketAsset[] memory)
    {
        return _basketBlueprintAssets[basketBlueprintName];
    }

    function defineBasketBlueprint(
        bytes32 basketBlueprintName,
        BasketAsset[] memory assets,
        address owner
    ) external onlyBasketBlueprintOwner(basketBlueprintName) {
        assets = _validateBasketBlueprint(assets);

        for (uint256 i = 0; i < assets.length; ++i) {
            _basketBlueprintAssets[basketBlueprintName].push(assets[i]);
        }

        _basketBlueprintOwners[basketBlueprintName] = owner;

        emit BasketBlueprintDefined(basketBlueprintName, owner);
    }

    function transferBasketBlueprintOwnership(
        bytes32 basketBlueprintName,
        address newOwner
    ) external onlyBasketBlueprintOwner(basketBlueprintName) {
        address previousOwner = basketBlueprintOwner(basketBlueprintName);

        _basketBlueprintOwners[basketBlueprintName] = newOwner;

        emit BasketBlueprintOwnerChanged(
            basketBlueprintName,
            previousOwner,
            newOwner
        );
    }

    function basketBlueprintRiskRate(bytes32 basketBlueprintName)
        external
        view
        basketBlueprintExists(basketBlueprintName)
        returns (uint256 riskRate)
    {
        BasketAsset[] memory assets = basketBlueprintAssets(
            basketBlueprintName
        );

        // FORMULA = SUM (asset risk rate * asset weight)/ SUM (asset weights)
        uint256 weightedRiskRatesSum; // = SUM (asset risk rate * asset weight)
        uint256 weightsSum; // = SUM (asset weights)
        for (uint256 i = 0; i < assets.length; ++i) {
            // unchecked is ok here because riskRate is max uint32 (actually even riskRateMaxValue)
            // and asset weight is max uint32, multiplied fits easily into uint256
            unchecked {
                weightedRiskRatesSum +=
                    (uint256(assets[i].riskRate) * uint256(assets[i].weight)) /
                    1e6; // weight has decimals 1e6
                weightsSum += assets[i].weight;
            }
        }

        unchecked {
            riskRate = (weightedRiskRatesSum * 1e6) / weightsSum; // weight has decimals 1e6
        }
    }

    /// @notice Ensures valid values for all basket assets and sets default weight if necessary
    function _validateBasketBlueprint(BasketAsset[] memory assets)
        internal
        view
        returns (BasketAsset[] memory)
    {
        for (uint256 i = 0; i < assets.length; ++i) {
            if (
                address(assets[i].asset) == address(0) ||
                assets[i].riskRate == 0 ||
                assets[i].riskRate > riskRateMaxValue ||
                assets[i].assetType > 1 // this has to be adjusted if more walletIdTypes become available...
                // contract upgradeable or have a MAX_ASSET_TYPE adjustable and configurable by an owner?
            ) {
                revert BasketBlueprintRegistry__InvalidParams();
            }

            if (assets[i].weight == 0) {
                assets[i].weight = defaultWeight;
            }

            // risk rate must match the protocol risk rate for the asset, if defined
            uint32 protocolAssetRiskRate = assetRiskRates[
                address(assets[i].asset)
            ];
            if (
                protocolAssetRiskRate != 0 &&
                protocolAssetRiskRate != assets[i].riskRate
            ) {
                revert BasketBlueprintRegistry__RiskRateMismatch();
            }
        }

        return assets;
    }
}
