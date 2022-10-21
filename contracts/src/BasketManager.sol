// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

import {IBasketManager} from "./interfaces/IBasketManager.sol";

error BasketManager__Unauthorized();

contract BasketManager is IBasketManager {
    // basket NFT token id -> BasketMeta
    mapping(uint256 => BasketMeta) public basketMetas;

    address public immutable basketBuilder;

    constructor(address _basketBuilder) {
        basketBuilder = _basketBuilder;
    }

    modifier onlyBasketBuilder() {
        if (msg.sender != basketBuilder) {
            revert BasketManager__Unauthorized();
        }
        _;
    }

    function createBasketMeta(
        uint256 tokenId,
        bytes32 basketBlueprintName,
        uint32 riskRate
    ) external onlyBasketBuilder {
        basketMetas[tokenId] = BasketMeta(basketBlueprintName, riskRate);
    }

    // future features: Basket Modifications
    // adjust risk rate
    // rebalance
    // adjust to new weights etc.
}
