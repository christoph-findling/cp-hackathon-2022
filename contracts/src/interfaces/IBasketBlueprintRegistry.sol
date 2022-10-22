// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBasketBlueprintRegistry {
    // tightly packed to 32 bytes
    struct BasketAsset {
        IERC20 asset; // 20 bytes
        // risk rate should be 1e6, i.e. a risk rate of 1% would be 1_000_000. 10% 10_000_000 etc.
        // must be >0 and <=100% (1 and 100_000_000)
        uint32 riskRate; // 4 bytes
        // weight should be 1e6, i.e. a weight of 1 would be 1_000_000. default weight is 10_000_000
        // must be >0
        uint64 weight; // 8 bytes
    }

    // later maybe: basketBluePrintNames array[]
    // verified status of basketBluePrint

    event BasketBlueprintDefined(bytes32 basketBlueprintName, address owner);
    event BasketBlueprintOwnerChanged(
        bytes32 basketBlueprintName,
        address previousOwner,
        address newOwner
    );

    function riskRateMaxValue() external view returns (uint32);

    function defaultWeight() external view returns (uint64);

    function basketBlueprintDefined(bytes32 basketBlueprintName)
        external
        view
        returns (bool);

    function basketBlueprintOwner(bytes32 basketBlueprintName)
        external
        view
        returns (address);

    function basketBlueprintAssets(bytes32 basketBlueprintName)
        external
        view
        returns (BasketAsset[] memory);

    function defineBasketBlueprint(
        bytes32 basketBlueprintName,
        BasketAsset[] calldata assets,
        address owner
    ) external;

    function transferBasketBlueprintOwnership(
        bytes32 basketBlueprintName,
        address newOwner
    ) external;

    function basketBlueprintRiskRate(bytes32 basketBlueprintName)
        external
        view
        returns (uint256 riskRate);
}
