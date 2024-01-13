// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.23;

import {FinthetixStakingToken} from "./FinthetixStakingToken.sol";

interface FSCErrors {
    /**
     * @notice Zero is not a valid amount of tokens to stake. If you
     *  wish to withdraw tokens, use the dedicated function.
     */
    error CannotStakeZeroAmount(address stakerAddr);

    /**
     * @notice Staking cannot happen from zero address
     */
    error StakerAddressCannotBeZeroAddress();
}

contract FinthetixStakingContract is FSCErrors {
    FinthetixStakingToken public immutable stakingToken = new FinthetixStakingToken();

    mapping(address => uint256) private mapAddrToStakedBal;

    function stake(uint256 amtToStake) external {
        // checks
        if (msg.sender == address(0)) revert StakerAddressCannotBeZeroAddress();
        if (amtToStake == 0) revert CannotStakeZeroAmount(msg.sender);

        // effects
        mapAddrToStakedBal[msg.sender] += amtToStake;

        // interactions
        stakingToken.transferFrom(msg.sender, address(this), amtToStake);
    }

    function getCurrStakedBalance() external returns (uint256) {
        return mapAddrToStakedBal[msg.sender];
    }
}
