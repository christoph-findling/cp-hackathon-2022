// SPDX-License-Identifier: No License
pragma solidity >=0.8.17;

import {IBasketManager} from "./interfaces/IBasketManager.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

error BasketManager__Unauthorized();

contract BasketManager is Ownable, IBasketManager {
    // basket NFT token id -> BasketMeta
    mapping(uint256 => BasketMeta) public basketMetas;

    mapping(address => bool) public basketBuilders;

    // solhint-disable-next-line no-empty-blocks
    constructor() Ownable() {}

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

    // future features: Basket Modifications
    // adjust risk rate
    // rebalance
    // adjust to new weights etc.
}
