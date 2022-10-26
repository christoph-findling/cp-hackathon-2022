// SPDX-License-Identifier: No License
pragma solidity >=0.8.17;

import {IBasketManager} from "./interfaces/IBasketManager.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IProtonB} from "./external/charged-particles/IProtonB.sol";
import {IChargedParticles} from "./external/charged-particles/IChargedParticles.sol";
import {IChargedState} from "./external/charged-particles/IChargedState.sol";

import {IBasketBlueprintRegistry} from "./interfaces/IBasketBlueprintRegistry.sol";

error BasketManager__Unauthorized();
error BasketManager__AssetTypeNotSupported();

contract BasketManager is Ownable, IBasketManager {
    // basket NFT token id -> BasketMeta
    mapping(uint256 => BasketMeta) public basketMetas;

    mapping(address => bool) public basketBuilders;

    IBasketBlueprintRegistry public immutable basketBlueprintRegistry;
    IProtonB public immutable protonB;
    IChargedParticles public immutable chargedParticles;

    // solhint-disable-next-line no-empty-blocks
    constructor(
        IBasketBlueprintRegistry _basketBlueprintRegistry,
        IProtonB _protonB,
        IChargedParticles _chargedParticles
    ) Ownable() {
        chargedParticles = _chargedParticles;
        protonB = _protonB;
        basketBlueprintRegistry = _basketBlueprintRegistry;
    }

    modifier onlyBasketBuilder() {
        if (!isBasketBuilder(msg.sender)) {
            revert BasketManager__Unauthorized();
        }
        _;
    }

    function isBasketBuilder(address basketBuilder) public view returns (bool) {
        return basketBuilders[basketBuilder] == true;
    }

    function setBasketBuilder(address basketBuilder, bool allowed)
        external
        onlyOwner
    {
        basketBuilders[basketBuilder] = allowed;
    }

    function createBasketMeta(
        uint256 tokenId,
        bytes32 basketBlueprintName,
        uint32 riskRate
    ) external onlyBasketBuilder {
        basketMetas[tokenId] = BasketMeta(basketBlueprintName, riskRate);
    }

    // expected to be called with callStatic
    function getBasketAssetAmounts(uint256 tokenId)
        external
        returns (address[] memory assets, uint256[] memory amounts)
    {
        IBasketBlueprintRegistry.BasketAsset[]
            memory basketAssets = basketBlueprintRegistry.basketBlueprintAssets(
                basketMetas[tokenId].blueprintName
            );

        assets = new address[](basketAssets.length);
        amounts = new uint256[](basketAssets.length);

        for (uint256 i = 0; i < basketAssets.length; ++i) {
            assets[i] = address(basketAssets[i].asset);
            amounts[i] = chargedParticles.baseParticleMass(
                address(protonB),
                tokenId,
                _mapAssetTypeToWalletManagerId(basketAssets[i].assetType),
                assets[i]
            );
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
            revert BasketManager__AssetTypeNotSupported();
        }
    }

    // future features: Basket Modifications
    // adjust risk rate
    // rebalance
    // adjust to new weights etc.
}
