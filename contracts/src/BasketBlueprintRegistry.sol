// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

import {IBasketBlueprintRegistry} from "./IBasketBlueprintRegistry.sol";
import {AssetRiskRateRegistry} from "./AssetRiskRateRegistry.sol";

error Unauthorized();
error InvalidParams();

contract BasketBlueprintsRegistry is
    AssetRiskRateRegistry,
    IBasketBlueprintRegistry
{
    uint64 public constant defaultWeight = 10_000_000;

    mapping(bytes32 => BasketBlueprint) public basketBlueprints;

    modifier onlyBasketBlueprintOwner(bytes32 basketBlueprintName) {
        address _basketBlueprintOwner = basketBlueprintOwner(
            basketBlueprintName
        );
        if (
            _basketBlueprintOwner != address(0) &&
            _basketBlueprintOwner != msg.sender
        ) {
            revert Unauthorized();
        }
        _;
    }

    constructor() AssetRiskRateRegistry() {}

    function basketBlueprint(bytes32 basketBlueprintName)
        public
        view
        returns (BasketBlueprint memory)
    {
        return basketBlueprints[basketBlueprintName];
    }

    function basketBlueprintOwner(bytes32 basketBlueprintName)
        public
        view
        returns (address)
    {
        return basketBlueprints[basketBlueprintName].owner;
    }

    function basketBlueprintAssets(bytes32 basketBlueprintName)
        public
        view
        returns (BasketAsset[] memory)
    {
        return basketBlueprints[basketBlueprintName].assets;
    }

    function defineBasketBlueprint(
        bytes32 basketBlueprintName,
        BasketAsset[] memory assets
    ) external onlyBasketBlueprintOwner(basketBlueprintName) {
        for (uint256 i = 0; i < assets.length; ++i) {
            if (
                address(assets[i].asset) == address(0) ||
                assets[i].riskRate == 0
            ) {
                revert InvalidParams();
            }

            if (assets[i].weight == 0) {
                assets[i].weight = defaultWeight;
            }
        }

        basketBlueprints[basketBlueprintName] = BasketBlueprint(
            assets,
            msg.sender
        );

        emit BasketBlueprintDefined(basketBlueprintName);
    }

    function transferBasketBlueprintOwnership(
        bytes32 basketBlueprintName,
        address newOwner
    ) external onlyBasketBlueprintOwner(basketBlueprintName) {
        address previousOwner = basketBlueprints[basketBlueprintName].owner;

        basketBlueprints[basketBlueprintName].owner = newOwner;

        emit BasketBlueprintOwnerChanged(
            basketBlueprintName,
            previousOwner,
            newOwner
        );
    }
}
