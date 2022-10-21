// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

interface IBasketManager {
    struct BasketMeta {
        bytes32 blueprintName;
        uint32 riskRate; // user risk rate
    }

    function createBasketMeta(
        uint256 tokenId,
        bytes32 basketBlueprintName,
        uint32 riskRate
    ) external;
}
