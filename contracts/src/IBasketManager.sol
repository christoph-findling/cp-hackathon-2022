// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

interface IBasketManager {
    struct BasketMeta {
        bytes32 basketName;
        uint32 riskRate;
    }

    function createBasketMeta(
        uint256 tokenId,
        bytes32 basketName,
        uint32 riskRate
    ) external;
}
