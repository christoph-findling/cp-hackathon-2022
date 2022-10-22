// SPDX-License-Identifier: No License
pragma solidity >=0.8.17;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IProtonB} from "./external/charged-particles/IProtonB.sol";
import {IChargedParticles} from "./external/charged-particles/IChargedParticles.sol";
import {IChargedState} from "./external/charged-particles/IChargedState.sol";

import {IBasketBlueprintRegistry} from "./interfaces/IBasketBlueprintRegistry.sol";
import {IBasketManager} from "./interfaces/IBasketManager.sol";
import {MultiSwap} from "./MultiSwap.sol";

error BasketBuilder__BasketBlueprintNotDefined();
error BasketBuilder__Unauthorized();
error BasketBuilder__InvalidParams();

contract BasketBuilder is MultiSwap, Ownable {
    using SafeERC20 for IERC20;

    // default hardcoded values for now for formula "modifiers"
    uint32 public constant dx = 2; // increases significance of difference user risk Rate to asset risk rate
    uint32 public constant wx = 1; // increases significance of basketAsset weight

    IBasketBlueprintRegistry public immutable basketBlueprintRegistry;
    IBasketManager public immutable basketManager;

    IProtonB public immutable protonB;
    IChargedParticles public immutable chargedParticles;

    constructor(
        IBasketBlueprintRegistry _basketBlueprintRegistry,
        IBasketManager _basketManager,
        IProtonB _protonB,
        IChargedParticles _chargedParticles,
        address _zeroXSwapTarget
    ) MultiSwap(_zeroXSwapTarget) Ownable() {
        basketBlueprintRegistry = _basketBlueprintRegistry;
        basketManager = _basketManager;
        protonB = _protonB;
        chargedParticles = _chargedParticles;
    }

    function swapAndBuild(
        IERC20 inputToken,
        uint256 maxAmountInputToken,
        bytes[] calldata swapQuotes,
        bytes32 basketBlueprintName,
        address receiver,
        uint32 riskRate,
        uint256 unlockBlock
    ) external {
        IBasketBlueprintRegistry.BasketAsset[]
            memory basketAssets = _validBasketBlueprint(basketBlueprintName);

        IERC20[] memory toAssets;
        for (uint256 i = 0; i < basketAssets.length; ++i) {
            toAssets[i] = basketAssets[i].asset;
        }

        uint256[] memory assetAmounts = multiSwap(
            inputToken,
            maxAmountInputToken,
            toAssets,
            swapQuotes
        );

        _validBuildValues(basketAssets, riskRate, assetAmounts);

        uint256 tokenId = _buildBasket(
            basketAssets,
            assetAmounts,
            receiver,
            unlockBlock
        );

        // store particle token Id -> basketBlueprintName, user riskRate in BasketManager
        basketManager.createBasketMeta(tokenId, basketBlueprintName, riskRate);
    }

    /// expects transferFrom from msg.sender for each asset is executable (this is swaps logic agnostic)
    /// use swapAndBuild instead if going from one input token to a basket directly
    /// @param assetAmounts amount for each basketBlueprint asset in the same order (!)
    ///                     as basketAssets (BasketBlueprintRegistry.basketBlueprintAssets())
    function build(
        bytes32 basketBlueprintName,
        address receiver,
        uint32 riskRate,
        uint256[] calldata assetAmounts,
        uint256 unlockBlock
    ) external {
        IBasketBlueprintRegistry.BasketAsset[]
            memory basketAssets = _validBasketBlueprint(basketBlueprintName);

        _validBuildValues(basketAssets, riskRate, assetAmounts);

        // transferFrom each basketAsset in; according to assetAmounts (assumes ERC20 approve has been executed)
        for (uint256 i = 0; i < basketAssets.length; ++i) {
            basketAssets[i].asset.safeTransferFrom(
                msg.sender,
                address(this),
                assetAmounts[i]
            );
        }

        uint256 tokenId = _buildBasket(
            basketAssets,
            assetAmounts,
            receiver,
            unlockBlock
        );

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
        IBasketBlueprintRegistry.BasketAsset[]
            memory basketAssets = _validBasketBlueprint(basketBlueprintName);

        uint256 amountsSum;
        (amounts, assets, amountsSum) = _getBasketAssetsRatios(
            riskRate,
            basketAssets
        );

        amounts = _alignBasketAssetsRatiosToInput(
            amounts,
            inputAmount,
            amountsSum
        );

        return (assets, amounts);
    }

    function _getBasketAssetsRatios(
        uint32 riskRate,
        IBasketBlueprintRegistry.BasketAsset[] memory basketAssets
    )
        internal
        view
        returns (
            uint256[] memory amounts,
            address[] memory assets,
            uint256 amountsSum
        )
    {
        if (riskRate > basketBlueprintRegistry.riskRateMaxValue()) {
            revert BasketBuilder__InvalidParams();
        }

        // get basketBlueprint amounts generalized not specific to inputAmount yet
        for (uint256 i = 0; i < basketAssets.length; ++i) {
            assets[i] = address(basketAssets[i].asset);
            amounts[i] = _getBasketAssetRatio(riskRate, basketAssets[i]);
            amountsSum += amounts[i];
        }
    }

    function _getBasketAssetRatio(
        uint32 riskRate,
        IBasketBlueprintRegistry.BasketAsset memory basketAsset
    ) internal view returns (uint256 ratio) {
        // FORMULA: y = riskRateMaxValue * dx - d * dx + w * wx
        // d must be > 0 and can be maximally `riskRateMaxValue`
        // w must be > 0
        // d = differenceAbs of riskRate to assetRiskRate. because of risk rates can be maximally riskRateMaxValue
        // the diff abs is also maximally riskRateMaxValue

        uint256 riskRateDifference = _absDifference(
            riskRate,
            basketAsset.riskRate
        ); // = d in formula

        ratio =
            (basketBlueprintRegistry.riskRateMaxValue() * dx) -
            (riskRateDifference * dx) +
            (basketAsset.weight * wx);
    }

    function _buildBasket(
        IBasketBlueprintRegistry.BasketAsset[] memory basketAssets,
        uint256[] memory assetAmounts,
        address receiver,
        uint256 unlockBlock
    ) internal returns (uint256 tokenId) {
        // 1. create charged particle NFT with first asset wrapped
        basketAssets[0].asset.safeApprove(address(protonB), assetAmounts[0]);

        tokenId = protonB.createChargedParticle(
            owner(), // creator
            receiver, // receiver
            address(0), // referrer
            "", // tokenMetaUri -> to-do later
            "", // walletManagerId -> @TODO what is the walletManagerId??
            // is this the chargedParticles.getManagersAddress()? is that the Charged Settings contract?
            // or can I simply set a custom walletManagerId here that represents us as creator? E.g. "testudo"
            address(basketAssets[0].asset), // assetToken
            assetAmounts[0], // assetAmount
            0 // annuityPercent
        );

        // 2. ChargedParticles.energizeParticle forEach asset (except first, which is already in)
        for (uint256 i = 1; i < basketAssets.length; ++i) {
            // The account must approve THIS (ChargedParticles.sol) contract as operator of the asset. ?
            // "as operator" -> @TODO what does this mean? is approve for the ERC20 enough?
            // how can the account approve someone as operator?
            basketAssets[i].asset.safeApprove(
                address(chargedParticles),
                assetAmounts[i]
            );

            chargedParticles.energizeParticle(
                // The address to the contract of the token (Particle)
                address(0), // contractAddress ... @TODO -> is this the address to the tokens smart wallet?
                // how do I get that address?
                tokenId, // tokenId
                "", // walletManagerId -> same as above
                address(basketAssets[i].asset), // assetToken
                assetAmounts[i], // assetAmount
                address(0) // referrer
            );
        }

        IChargedState chargedState = IChargedState(
            chargedParticles.getStateAddress()
        );
        if (unlockBlock != 0) {
            // @TODO: for timelock until a certain block (We don't use bonds) -> is releaseTimelock correct?
            chargedState.setReleaseTimelock(
                address(0), // contractAddress ... same as above
                tokenId, // tokenId
                unlockBlock
            );
            // @TODO: do we have to get permisions somehow first to execute this?
        }

        // @TODO: restrict charge / discharge etc. -> should only be possible through protocol to make sure
        // protocol basket metadata is in line with basket contents
        // Does it make sense to call each one individually? is there a better way?
        // @TODO 2: when the user wants to withdraw part of the basket and does this through our protocol
        // would we first execute chargedState.setPermsForAllowDischarge to false etc., then withdraw
        // and at the end  set it to true again?
        chargedState.setPermsForRestrictCharge(
            address(0), // contractAddress... same as above
            tokenId,
            true
        );
        chargedState.setPermsForAllowDischarge(
            address(0), // contractAddress... same as above
            tokenId,
            false
        );
        chargedState.setPermsForAllowRelease(
            address(0), // contractAddress... same as above
            tokenId,
            false
        );
        chargedState.setPermsForRestrictBond(
            address(0), // contractAddress... same as above
            tokenId,
            false
        );
        chargedState.setPermsForAllowBreakBond(
            address(0), // contractAddress... same as above
            tokenId,
            false
        );
    }

    function _validBuildValues(
        IBasketBlueprintRegistry.BasketAsset[] memory basketAssets,
        uint32 riskRate,
        uint256[] memory assetAmounts
    ) internal view {
        if (
            basketAssets.length > 0 &&
            assetAmounts.length != basketAssets.length
        ) {
            revert BasketBuilder__InvalidParams();
        }

        // can't get actual basketAssetAmounts (would need price related to inputToken -> asset)
        // instead expect amounts for each basketAsset in input params

        // get should be asset ratios / amounts
        uint256[] memory shouldBeAmounts;
        (shouldBeAmounts, , ) = _getBasketAssetsRatios(riskRate, basketAssets);
        // and ensure ratios of input param asset amounts are matching with the given user riskRate
        for (uint256 i = 0; i < basketAssets.length - 1; ++i) {
            // compare ratio of asset to next asset
            uint256 isRatio = (assetAmounts[i] * 1e18) / assetAmounts[i + 1];
            uint256 shouldBeRatio = (shouldBeAmounts[i] * 1e18) /
                shouldBeAmounts[i + 1];

            if (_absDifference(isRatio, shouldBeRatio) > 1e6) {
                // allow for some tolerance of 1e6 in divergence
                revert BasketBuilder__InvalidParams();
            }
        }
    }

    function _validBasketBlueprint(bytes32 basketBlueprintName)
        internal
        view
        returns (IBasketBlueprintRegistry.BasketAsset[] memory basketAssets)
    {
        if (
            !basketBlueprintRegistry.basketBlueprintDefined(basketBlueprintName)
        ) {
            revert BasketBuilder__BasketBlueprintNotDefined();
        }

        basketAssets = basketBlueprintRegistry.basketBlueprintAssets(
            basketBlueprintName
        );
    }

    function _alignBasketAssetsRatiosToInput(
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
        // can't underflow because we explicitly check for it
        unchecked {
            if (num1 == num2) {
                return 0;
            } else if (num1 > num2) {
                return num1 - num2;
            } else {
                return num2 - num1;
            }
        }
    }
}
