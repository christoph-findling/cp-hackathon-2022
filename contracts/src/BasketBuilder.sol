// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IBasketBlueprintRegistry} from "./IBasketBlueprintRegistry.sol";
import {IBasketManager} from "./IBasketManager.sol";

error BasketBuilder__BasketBlueprintNotDefined();
error BasketBuilder__Unauthorized();
error BasketBuilder__InvalidParams();

contract BasketBuilder {
    using SafeERC20 for IERC20;

    IBasketBlueprintRegistry public immutable basketBlueprintRegistry;
    IBasketManager public immutable basketManager;

    constructor(
        IBasketBlueprintRegistry _basketBlueprintRegistry,
        IBasketManager _basketManager
    ) {
        basketBlueprintRegistry = _basketBlueprintRegistry;
        basketManager = _basketManager;
    }

    // expects transferFrom from msg.sender for each asset is executable (builder is swaps logic agnostic)
    /// @param assetAmounts amount for each basket asset in the same order (!)
    ///                     as basketAssets (BasketBlueprintRegistry.basketAssets())
    function build(
        bytes32 basketBlueprintName,
        address receiver,
        uint32 riskRate,
        uint256[] calldata assetAmounts
    ) external {
        IBasketBlueprintRegistry.BasketBlueprint
            memory basketBlueprint = _validBasket(basketBlueprintName);

        if (assetAmounts.length != basketBlueprint.assets.length) {
            revert BasketBuilder__InvalidParams();
        }

        // can't get actual basketAssetAmounts (would need price related to inputToken -> asset)
        // instead expect amounts for each basketAsset

        // and ensure weights of asset amounts are matching with the given user riskRate
        uint256[] memory shouldBeAmounts;
        (shouldBeAmounts, , ) = basketAssetsWeight(riskRate, basketBlueprint);
        for (uint256 i = 0; i < basketBlueprint.assets.length - 1; ++i) {
            // compare ratio of asset to next asset
            uint256 isRatio = (assetAmounts[i] * 1e18) / assetAmounts[i + 1];
            uint256 shouldBeRatio = (shouldBeAmounts[i] * 1e18) /
                shouldBeAmounts[i + 1];

            if (_absDifference(isRatio, shouldBeRatio) > 1e6) {
                revert BasketBuilder__InvalidParams();
            }
        }

        uint256 tokenId = 0; // ProtonB.createChargedParticle
        // execute transferFrom for each amounts. BasketSwapper has to approve all basketTokens...
        // approve once, to BasketBuilder, with max UINT
        // ChargedParticles.energizeParticle forEach

        // store particle token Id -> basketBlueprintName, user riskRate in BasketManager
        basketManager.createBasketMeta(tokenId, basketBlueprintName, riskRate);
    }

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
    ) public view returns (address[] memory assets, uint256[] memory amounts) {
        IBasketBlueprintRegistry.BasketBlueprint
            memory basketBlueprint = _validBasket(basketBlueprintName);

        uint256 amountsSum;
        (amounts, assets, amountsSum) = basketAssetsWeight(
            riskRate,
            basketBlueprint
        );

        amounts = _alignBasketAssetsWeightToInput(
            amounts,
            inputAmount,
            amountsSum
        );

        return (assets, amounts);
    }

    function basketAssetsWeight(
        uint32 riskRate,
        IBasketBlueprintRegistry.BasketBlueprint memory basketBlueprint
    )
        internal
        pure
        returns (
            uint256[] memory amounts,
            address[] memory assets,
            uint256 amountsSum
        )
    {
        // get basketBlueprint amounts generalized not specific to inputAmount yet
        for (uint256 i = 0; i < basketBlueprint.assets.length; ++i) {
            IBasketBlueprintRegistry.BasketAsset
                memory basketAsset = basketBlueprint.assets[i];

            assets[i] = address(basketAsset.asset);

            uint256 riskRateDifference = _absDifference(
                riskRate,
                basketAsset.riskRate
            );
            if (riskRateDifference == 0) {
                // if difference is 0 we use 1 instead (smallest possible nonzero difference)
                // because we use the riskRateDifference as denominator in a subsequent division
                // and we don't want to cause a nuclear meltdown by dividing by 0
                riskRateDifference = 1;
            }

            amounts[i] = (basketAsset.weight * 1e18) / riskRateDifference;
            amountsSum += amounts[i];
        }
    }

    function _validBasket(bytes32 basketBlueprintName)
        internal
        view
        returns (
            IBasketBlueprintRegistry.BasketBlueprint memory basketBlueprint
        )
    {
        basketBlueprint = basketBlueprintRegistry.basketBlueprint(
            basketBlueprintName
        );

        if (basketBlueprint.owner == address(0)) {
            revert BasketBuilder__BasketBlueprintNotDefined();
        }
    }

    function _alignBasketAssetsWeightToInput(
        uint256[] memory amounts,
        uint256 inputAmount,
        uint256 amountsSum
    ) internal pure returns (uint256[] memory) {
        // align the sum of amounts to the actual requested total input Amount
        if (amountsSum > inputAmount) {
            // total sum is too big, we have to divide values down
            uint256 denominator = (amountsSum * 1e18) / inputAmount;
            for (uint256 i = 0; i < amounts.length; ++i) {
                amounts[i] = (amounts[i] * 1e18) / denominator;
            }
        } else if (amountsSum < inputAmount) {
            // total sum is too small, we have to multiply values up
            uint256 multiplicator = (inputAmount * 1e18) / amountsSum;
            for (uint256 i = 0; i < amounts.length; ++i) {
                amounts[i] = (amounts[i] * multiplicator) / 1e18;
            }
        }

        return amounts;
    }

    function _absDifference(uint256 num1, uint256 num2)
        internal
        pure
        returns (uint256)
    {
        if (num1 == num2) {
            return 0;
        } else if (num1 > num2) {
            return num1 - num2;
        } else {
            return num2 - num1;
        }
    }
}
