// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

interface IChargedState {
    /***********************************|
    |             Public API            |
    |__________________________________*/

    function getDischargeTimelockExpiry(
        address contractAddress,
        uint256 tokenId
    ) external view returns (uint256 lockExpiry);

    function getReleaseTimelockExpiry(address contractAddress, uint256 tokenId)
        external
        view
        returns (uint256 lockExpiry);

    function getBreakBondTimelockExpiry(
        address contractAddress,
        uint256 tokenId
    ) external view returns (uint256 lockExpiry);

    function isApprovedForDischarge(
        address contractAddress,
        uint256 tokenId,
        address operator
    ) external returns (bool);

    function isApprovedForRelease(
        address contractAddress,
        uint256 tokenId,
        address operator
    ) external returns (bool);

    function isApprovedForBreakBond(
        address contractAddress,
        uint256 tokenId,
        address operator
    ) external returns (bool);

    function isApprovedForTimelock(
        address contractAddress,
        uint256 tokenId,
        address operator
    ) external returns (bool);

    function isEnergizeRestricted(address contractAddress, uint256 tokenId)
        external
        view
        returns (bool);

    function isCovalentBondRestricted(address contractAddress, uint256 tokenId)
        external
        view
        returns (bool);

    function getDischargeState(
        address contractAddress,
        uint256 tokenId,
        address sender
    )
        external
        returns (
            bool allowFromAll,
            bool isApproved,
            uint256 timelock,
            uint256 tempLockExpiry
        );

    function getReleaseState(
        address contractAddress,
        uint256 tokenId,
        address sender
    )
        external
        returns (
            bool allowFromAll,
            bool isApproved,
            uint256 timelock,
            uint256 tempLockExpiry
        );

    function getBreakBondState(
        address contractAddress,
        uint256 tokenId,
        address sender
    )
        external
        returns (
            bool allowFromAll,
            bool isApproved,
            uint256 timelock,
            uint256 tempLockExpiry
        );

    /***********************************|
  |      Only NFT Owner/Operator      |
  |__________________________________*/

    function setDischargeApproval(
        address contractAddress,
        uint256 tokenId,
        address operator
    ) external;

    function setReleaseApproval(
        address contractAddress,
        uint256 tokenId,
        address operator
    ) external;

    function setBreakBondApproval(
        address contractAddress,
        uint256 tokenId,
        address operator
    ) external;

    function setTimelockApproval(
        address contractAddress,
        uint256 tokenId,
        address operator
    ) external;

    function setApprovalForAll(
        address contractAddress,
        uint256 tokenId,
        address operator
    ) external;

    function setPermsForRestrictCharge(
        address contractAddress,
        uint256 tokenId,
        bool state
    ) external;

    function setPermsForAllowDischarge(
        address contractAddress,
        uint256 tokenId,
        bool state
    ) external;

    function setPermsForAllowRelease(
        address contractAddress,
        uint256 tokenId,
        bool state
    ) external;

    function setPermsForRestrictBond(
        address contractAddress,
        uint256 tokenId,
        bool state
    ) external;

    function setPermsForAllowBreakBond(
        address contractAddress,
        uint256 tokenId,
        bool state
    ) external;

    function setDischargeTimelock(
        address contractAddress,
        uint256 tokenId,
        uint256 unlockBlock
    ) external;

    function setReleaseTimelock(
        address contractAddress,
        uint256 tokenId,
        uint256 unlockBlock
    ) external;

    function setBreakBondTimelock(
        address contractAddress,
        uint256 tokenId,
        uint256 unlockBlock
    ) external;

    /***********************************|
  |         Only NFT Contract         |
  |__________________________________*/

    function setTemporaryLock(
        address contractAddress,
        uint256 tokenId,
        bool isLocked
    ) external;

    /***********************************|
  |          Particle Events          |
  |__________________________________*/

    event Initialized(address indexed initiator);
    event ControllerSet(address indexed controllerAddress, string controllerId);

    event DischargeApproval(
        address indexed contractAddress,
        uint256 indexed tokenId,
        address indexed owner,
        address operator
    );
    event ReleaseApproval(
        address indexed contractAddress,
        uint256 indexed tokenId,
        address indexed owner,
        address operator
    );
    event BreakBondApproval(
        address indexed contractAddress,
        uint256 indexed tokenId,
        address indexed owner,
        address operator
    );
    event TimelockApproval(
        address indexed contractAddress,
        uint256 indexed tokenId,
        address indexed owner,
        address operator
    );

    event TokenDischargeTimelock(
        address indexed contractAddress,
        uint256 indexed tokenId,
        address indexed operator,
        uint256 unlockBlock
    );
    event TokenReleaseTimelock(
        address indexed contractAddress,
        uint256 indexed tokenId,
        address indexed operator,
        uint256 unlockBlock
    );
    event TokenBreakBondTimelock(
        address indexed contractAddress,
        uint256 indexed tokenId,
        address indexed operator,
        uint256 unlockBlock
    );
    event TokenTempLock(
        address indexed contractAddress,
        uint256 indexed tokenId,
        uint256 unlockBlock
    );

    event PermsSetForRestrictCharge(
        address indexed contractAddress,
        uint256 indexed tokenId,
        bool state
    );
    event PermsSetForAllowDischarge(
        address indexed contractAddress,
        uint256 indexed tokenId,
        bool state
    );
    event PermsSetForAllowRelease(
        address indexed contractAddress,
        uint256 indexed tokenId,
        bool state
    );
    event PermsSetForRestrictBond(
        address indexed contractAddress,
        uint256 indexed tokenId,
        bool state
    );
    event PermsSetForAllowBreakBond(
        address indexed contractAddress,
        uint256 indexed tokenId,
        bool state
    );
}
