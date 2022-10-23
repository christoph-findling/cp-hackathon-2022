// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IProtonB is IERC721 {
    event UniverseSet(address indexed universe);
    event ChargedStateSet(address indexed chargedState);
    event ChargedSettingsSet(address indexed chargedSettings);
    event ChargedParticlesSet(address indexed chargedParticles);

    /***********************************|
    |             Public API            |
    |__________________________________*/

    function createProtonForSale(
        address creator,
        address receiver,
        string memory tokenMetaUri,
        uint256 annuityPercent,
        uint256 royaltiesPercent,
        uint256 salePrice
    ) external returns (uint256 newTokenId);

    function createChargedParticle(
        address creator,
        address receiver,
        address referrer,
        string memory tokenMetaUri,
        string memory walletManagerId,
        address assetToken,
        uint256 assetAmount,
        uint256 annuityPercent
    ) external returns (uint256 newTokenId);
}
