// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBasketBuilder {
    function swapAndBuild(
        IERC20 inputToken,
        uint256 maxAmountInputToken,
        bytes[] calldata swapQuotes,
        bytes32 basketBlueprintName,
        address receiver,
        uint32 riskRate,
        string memory tokenMetaUri,
        uint256 unlockBlock
    ) external returns (uint256 tokenId);

    function build(
        bytes32 basketBlueprintName,
        address receiver,
        uint32 riskRate,
        uint256[] calldata assetAmounts,
        string memory tokenMetaUri,
        uint256 unlockBlock
    ) external returns (uint256 tokenId);

    /// @notice Returns the amounts of input asset that should be spent for each basket asset given a certain risk rate
    /// @param basketBlueprintName   basketBlueprint name as in BasketBlueprintRegistry
    /// @param riskRate     user risk rate to build weighting amounts for. value between 1000 and 10.000?
    /// @param inputAmount  total amount of an input token that will be spent to acquire a basket basket
    /// @return assets -> the assets addresses in the same order as the amounts
    /// @return amounts -> the amounts of input token to be spent for acquiring each basket asset
    function getSpendAmounts(
        bytes32 basketBlueprintName,
        uint32 riskRate,
        uint256 inputAmount
    ) external returns (address[] memory assets, uint256[] memory amounts);
}
=======
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBasketBuilder {
    function swapAndBuild(
        IERC20 inputToken,
        uint256 maxAmountInputToken,
        bytes[] calldata swapQuotes,
        bytes32 basketBlueprintName,
        address receiver,
        uint32 riskRate,
        string memory tokenMetaUri,
        uint256 unlockBlock
    ) external returns (uint256 tokenId);

    function build(
        bytes32 basketBlueprintName,
        address receiver,
        uint32 riskRate,
        uint256[] calldata assetAmounts,
        string memory tokenMetaUri,
        uint256 unlockBlock
    ) external returns (uint256 tokenId);

    /// @notice Returns the amounts of input asset that should be spent for each basket asset given a certain risk rate
    /// @param basketBlueprintName   basketBlueprint name as in BasketBlueprintRegistry
    /// @param riskRate     user risk rate to build weighting amounts for. value between 1000 and 10.000?
    /// @param inputAmount  total amount of an input token that will be spent to acquire a basket basket
    /// @return assets -> the assets addresses in the same order as the amounts
    /// @return amounts -> the amounts of input token to be spent for acquiring each basket asset
    function getSpendAmounts(
        bytes32 basketBlueprintName,
        uint32 riskRate,
        uint256 inputAmount
    ) external returns (address[] memory assets, uint256[] memory amounts);
}
