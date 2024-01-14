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
     * @notice Zero is not a valid amount of tokens to unstake.
     */
    error CannotUnstakeZeroAmount(address stakerAddr);

    /**
     * @notice Zero address is not supported
     */
    error InvalidUserAddress();

    /**
     * @notice User should not be able to unstake more than they have staked
     */
    error CannotUnstakeMoreThanStakedAmount(address stakerAddr, uint256 amtToUnstake, uint256 availableStakedBal);
}

contract FinthetixStakingContract is FSCErrors {
    FinthetixStakingToken public immutable stakingToken = new FinthetixStakingToken();
    uint256 public totalAmtStaked;
    mapping(address => uint256) private amtStakedBy;

    function stake(uint256 amtToStake) external {
        // checks
        if (msg.sender == address(0)) revert InvalidUserAddress();
        if (amtToStake == 0) revert CannotStakeZeroAmount(msg.sender);

        // effects
        amtStakedBy[msg.sender] += amtToStake;
        totalAmtStaked += amtToStake;

        // interactions
        stakingToken.transferFrom(msg.sender, address(this), amtToStake);
    }

    function unstake(uint256 amtToUnstake) external {
        // checks
        if (msg.sender == address(0)) revert InvalidUserAddress();
        if (amtToUnstake == 0) revert CannotUnstakeZeroAmount(msg.sender);
        uint256 balanceOfSender = amtStakedBy[msg.sender];
        if (balanceOfSender < amtToUnstake) {
            revert CannotUnstakeMoreThanStakedAmount(msg.sender, amtToUnstake, balanceOfSender);
        }

        // effects
        amtStakedBy[msg.sender] -= amtToUnstake;
        totalAmtStaked -= amtToUnstake;

        // interactions
        stakingToken.transfer(msg.sender, amtToUnstake);
    }

    function getCurrStakedBalance() external view returns (uint256) {
        return amtStakedBy[msg.sender];
    }
}
