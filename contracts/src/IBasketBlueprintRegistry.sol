// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBasketBlueprintRegistry {
    // tightly packed to 32 bytes
    struct BasketAsset {
        IERC20 asset; // 20 bytes
        // risk rate should be 1e6, i.e. a risk rate of 1% would be 1_000_000. 10% 10_000_000 etc.
        uint32 riskRate; // 4 bytes
        // weight should be 1e6, i.e. a weight of 1 would be 1_000_000. default weight is 10_000_000
        uint64 weight; // 8 bytes
    }

    struct BasketBlueprint {
        BasketAsset[] assets;
        address owner;
    }

    event BasketBlueprintDefined(bytes32 basketBlueprintName);
    event BasketBlueprintOwnerChanged(
        bytes32 basketBlueprintName,
        address previousOwner,
        address newOwner
    );

    function basketBlueprint(bytes32 basketBlueprintName)
        external
        view
        returns (BasketBlueprint memory);

    function basketBlueprintOwner(bytes32 basketBlueprintName)
        external
        view
        returns (address);

    function defineBasketBlueprint(
        bytes32 basketBlueprintName,
        BasketAsset[] calldata assets
    ) external;

    function transferBasketBlueprintOwnership(
        bytes32 basketBlueprintName,
        address newOwner
    ) external;
}
