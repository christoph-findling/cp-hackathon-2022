// SPDX-License-Identifier: No License
pragma solidity >=0.8.17;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IProtonB} from "./external/charged-particles/IProtonB.sol";
import {IChargedParticles} from "./external/charged-particles/IChargedParticles.sol";
import {IChargedState} from "./external/charged-particles/IChargedState.sol";

import {IBasketBlueprintRegistry} from "./interfaces/IBasketBlueprintRegistry.sol";
import {IBasketManager} from "./interfaces/IBasketManager.sol";
import {IBasketBuilder} from "./interfaces/IBasketBuilder.sol";
import {MultiSwap} from "./MultiSwap.sol";

error BasketBuilder__BasketBlueprintNotDefined();
error BasketBuilder__Unauthorized();
error BasketBuilder__InvalidParams();

import "forge-std/console.sol";

contract BasketBuilder is MultiSwap, Ownable, IBasketBuilder, ERC721Holder {
    using SafeERC20 for IERC20;

    // default hardcoded values for now for formula "modifiers"
    uint32 public constant dx = 7; // increases significance of difference user risk Rate to asset risk rate
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
        string memory tokenMetaUri,
        uint256 unlockBlock
    ) external returns (uint256 tokenId) {
        IBasketBlueprintRegistry.BasketAsset[]
            memory basketAssets = _validBasketBlueprint(basketBlueprintName);

        console.log("swapAndBuild 2");
        IERC20[] memory toAssets = new IERC20[](basketAssets.length);
        for (uint256 i = 0; i < basketAssets.length; ++i) {
            toAssets[i] = basketAssets[i].asset;
        }
        console.log("swapAndBuild 3");
        uint256[] memory assetAmounts;
        uint256[] memory spentAmounts;
        (assetAmounts, spentAmounts) = multiSwap(
            inputToken,
            maxAmountInputToken,
            toAssets,
            swapQuotes
        );
        console.log("swapAndBuild 4");

        _validBuildValues(basketAssets, riskRate, spentAmounts);

        console.log("swapAndBuild 5");
        tokenId = _buildBasket(
            basketAssets,
            assetAmounts,
            receiver,
            tokenMetaUri,
            unlockBlock
        );

        console.log("swapAndBuild 6");
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
        string memory tokenMetaUri,
        uint256 unlockBlock
    ) external returns (uint256 tokenId) {
        IBasketBlueprintRegistry.BasketAsset[]
            memory basketAssets = _validBasketBlueprint(basketBlueprintName);

        // Todo: has to be adjusted to decimals
        // Validation with assetAmounts instead of spend amounts not functional right now,
        // assetAmounts would have to be brought to same decimals
        // _validBuildValues(basketAssets, riskRate, assetAmounts);

        // transferFrom each basketAsset in; according to assetAmounts (assumes ERC20 approve has been executed)
        for (uint256 i = 0; i < basketAssets.length; ++i) {
            basketAssets[i].asset.safeTransferFrom(
                msg.sender,
                address(this),
                assetAmounts[i]
            );
        }

        tokenId = _buildBasket(
            basketAssets,
            assetAmounts,
            receiver,
            tokenMetaUri,
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

        amounts = new uint256[](basketAssets.length);
        assets = new address[](basketAssets.length);

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
        string memory tokenMetaUri,
        uint256 unlockBlock
    ) internal returns (uint256 tokenId) {
        console.log("_buildBasket 1");
        // 1. create charged particle NFT with first asset wrapped
        basketAssets[0].asset.safeApprove(address(protonB), assetAmounts[0]);

        console.log("_buildBasket 2");
        tokenId = protonB.createChargedParticle(
            owner(), // creator
            address(this), // receiver -> this is initially this contract to have permissions for timelocking.
            // the NFT is transferred to the receiver at the end of this process.
            address(0), // referrer
            tokenMetaUri, // tokenMetaUri
            // walletManagerId -> either generic.B or aave.B (aave.B is yield bearing)
            _mapAssetTypeToWalletManagerId(basketAssets[0].assetType),
            address(basketAssets[0].asset), // assetToken
            assetAmounts[0], // assetAmount
            0 // annuityPercent
        );
        console.log("_buildBasket 3 tokenId ", tokenId);

        // 2. ChargedParticles.energizeParticle forEach asset (except first, which is already in)
        for (uint256 i = 1; i < basketAssets.length; ++i) {
            console.log("_buildBasket 4_1 (i):", i);
            basketAssets[i].asset.safeApprove(
                address(chargedParticles),
                assetAmounts[i]
            );

            uint256 chargedAmount = chargedParticles.energizeParticle(
                address(protonB), // contractAddress -> The address to the contract of the NFT token (Particle)
                tokenId, // tokenId
                _mapAssetTypeToWalletManagerId(basketAssets[i].assetType), // walletManagerId -> same as above
                address(basketAssets[i].asset), // assetToken
                assetAmounts[i], // assetAmount
                address(0) // referrer
            );
            console.log("_buildBasket 4_3 chargedAmount!", chargedAmount);
        }

        /**
         * Timelocking does work like implemented below, but a crucial part is missing.
         * This part has to be implemented next:
         * With the current logic, after transferring the NFT to the "receiver",
         * the "receiver" can freely interact with Charged Particles
         * contracts. This can lead to invalid states in our BasketMetadata,
         * and means that the "receiver" can lift the timelock or execute any other action on it.
         *
         * We can solve this by implementing an intermediary contract, a wallet contract that will
         * be the owner of the NFT instead of the "receiver" directly. The "receiver" still has non-custodial
         * access to the NFT, BUT the actions executable on it are within whatever boundaries we see fit.
         * Also, this means that our BasketMetadata can be updated.
         * Every user would get a clone of BasketManager and have his own BasketManager.
         * This allows to implement the TrustAccount use-case,
         * or pocket money (limited discharge amount per blocks) for a child.
         * Each user gets a wallet, can be a EIP-1167 minimal proxy clone or BeaconProxy clone similar to
         * https://github.com/notional-finance/wrapped-fcash/tree/master/contracts/proxy
         *
         * The tokenMetaUri of the protonB NFT is not modifiable so the off-chain metadata would either have to be
         * permanent or it could use an IPFS naming service such as IPNS https://docs.ipfs.io/concepts/ipns/
         * Permanent would be preferrable.
         */

        console.log("_buildBasket 5");
        IChargedState chargedState = IChargedState(
            chargedParticles.getStateAddress()
        );
        console.log("unlockBlock", unlockBlock);
        if (unlockBlock != 0) {
            chargedState.setReleaseTimelock( // principle amount
                address(protonB), // contractAddress
                tokenId, // tokenId
                unlockBlock
            );
            chargedState.setDischargeTimelock( // yield amount
                address(protonB), // contractAddress
                tokenId, // tokenId
                unlockBlock
            );
        }

        console.log("_buildBasket 6");

        // transfer NFT to receiver
        protonB.approve(receiver, tokenId);
        protonB.safeTransferFrom(address(this), receiver, tokenId);
        console.log("_buildBasket DONE");
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

            // assetAmounts have to be brought to same decimals
            uint256 isRatio = (assetAmounts[i] * 1e18) / assetAmounts[i + 1];
            uint256 shouldBeRatio = (shouldBeAmounts[i] * 1e18) /
                shouldBeAmounts[i + 1];

            // Todo: has to be adjusted to decimals
            if (_absDifference(isRatio, shouldBeRatio) > 1e15) {
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

    function _mapAssetTypeToWalletManagerId(uint32 assetType)
        public
        pure
        returns (string memory)
    {
        if (assetType == 0) {
            return "generic.B";
        } else if (assetType == 1) {
            return "aave.B";
        } else {
            // not supported for now. If more walletManagerIds become available in the future this has to be adjusted
            revert BasketBuilder__InvalidParams();
        }
    }
}
