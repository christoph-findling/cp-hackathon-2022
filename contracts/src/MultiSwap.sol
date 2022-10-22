// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.17;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MultiSwap {
    using SafeERC20 for IERC20;

    address public immutable zeroXSwapTarget;

    constructor(address _zeroXSwapTarget) {
        zeroXSwapTarget = _zeroXSwapTarget;
    }

    /// @param swapQuotes    The encoded 0x transactions to execute.
    ///                      Should include sellAmount (BasketBuilder.getSpendAmounts()), sellToken, buyToken etc.
    function multiSwap(
        IERC20 inputToken,
        uint256 maxAmountInputToken,
        IERC20[] memory toAssets,
        bytes[] calldata swapQuotes
    ) public returns (uint256[] memory obtainedAmounts) {
        // for now per default via 0x, later there could be
        // adapters, e.g. 0xAdapter etc. which can be defined per token?

        inputToken.safeTransferFrom(
            msg.sender,
            address(this),
            maxAmountInputToken
        );
        _safeApprove(inputToken, zeroXSwapTarget, maxAmountInputToken);

        for (uint256 i = 0; i < swapQuotes.length; ++i) {
            uint256 balanceBefore = toAssets[i].balanceOf(address(this));
            _fillQuote(swapQuotes[i]);
            uint256 balanceAfter = toAssets[i].balanceOf(address(this));
            obtainedAmounts[i] = balanceAfter - balanceBefore;
        }
    }

    /**
     * Execute a 0x Swap quote
     *
     * @param _quote          Swap quote as returned by 0x API
     *
     */
    function _fillQuote(bytes memory _quote) internal {
        (bool success, bytes memory returndata) = zeroXSwapTarget.call(_quote);

        // Forwarding errors including new custom errors
        // Taken from: https://ethereum.stackexchange.com/a/111187/73805
        if (!success) {
            if (returndata.length == 0) revert();
            assembly {
                revert(add(32, returndata), mload(returndata))
            }
        }
    }

    /**
     * Sets a max approval limit for an ERC20 token, provided the current allowance
     * is less than the required allownce.
     *
     * @param _token    Token to approve
     * @param _spender  Spender address to approve
     */
    function _safeApprove(
        IERC20 _token,
        address _spender,
        uint256 _requiredAllowance
    ) internal {
        uint256 allowance = _token.allowance(address(this), _spender);
        if (allowance < _requiredAllowance) {
            _token.safeIncreaseAllowance(
                _spender,
                type(uint256).max - allowance
            );
        }
    }
}
