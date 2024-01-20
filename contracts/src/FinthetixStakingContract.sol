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

    /**
     * @param currTimestamp The timestamp at which user has attempted to interact with contract.
     * @param lastUpdatedRewardAt The timestamp at which reward was last updated. i.e. last interaction timestamp.
     * @notice Users cannot interact with contract in cool-down period.
     *  The contract will unlock at ``lastUpdatedRewardAt + max(COOLDOWN_CONSTANT/totalStakedAmt, 1)`` timestamp
     */
    error CannotInteractWhenCoolingDown(uint256 currTimestamp, uint256 lastUpdatedRewardAt);
}

contract FinthetixStakingContract is FSCErrors {
    uint256 public constant TOTAL_REWARDS_PER_SECOND = 0.5 ether;
    /**
     * @notice The required total staked amount in the contract, for a cooldown period of 1 second.
     *  The cooldown time will be proportional to the number of tokens staked in the contract (Total Value Locked)
     *
     * @dev To calculate the cooldown time, get the TVL(totalStakedAmt) and divide by COOLDOWN_CONSTANT
     */
    uint256 public constant COOLDOWN_CONSTANT = 100 ether;
    FinthetixStakingToken public immutable stakingToken = new FinthetixStakingToken();
    uint256 public totalStakedAmt;
    uint256 public lastUpdatedRewardAt;
    uint256 public alphaNow;

    mapping(address => uint256) private mapAddrToStakedAmt;
    mapping(address => uint256) private mapAddrToPublishedReward;
    mapping(address => uint256) private mapAddrToAlphaAtLastUserInteraction;

    function stake(uint256 amtToStake) external {
        // checks
        if (msg.sender == address(0)) revert InvalidUserAddress();
        if (amtToStake == 0) revert CannotStakeZeroAmount(msg.sender);

        // effects
        _updateReward();
        mapAddrToStakedAmt[msg.sender] += amtToStake;
        totalStakedAmt += amtToStake;

        // interactions
        stakingToken.transferFrom(msg.sender, address(this), amtToStake);
    }

    function unstake(uint256 amtToUnstake) external {
        // checks
        if (msg.sender == address(0)) revert InvalidUserAddress();
        if (amtToUnstake == 0) revert CannotUnstakeZeroAmount(msg.sender);
        uint256 balanceOfSender = mapAddrToStakedAmt[msg.sender];
        if (balanceOfSender < amtToUnstake) {
            revert CannotUnstakeMoreThanStakedAmount(msg.sender, amtToUnstake, balanceOfSender);
        }

        // effects
        _updateReward();
        mapAddrToStakedAmt[msg.sender] -= amtToUnstake;
        totalStakedAmt -= amtToUnstake;

        // interactions
        stakingToken.transfer(msg.sender, amtToUnstake);
    }

    function viewMyStakedAmt() external view returns (uint256) {
        return mapAddrToStakedAmt[msg.sender];
    }

    function viewMyPublishedRewards() external view returns (uint256) {
        return mapAddrToPublishedReward[msg.sender];
    }

    function _updateReward() private {
        // update alpha
        if (totalStakedAmt > 0) {
            uint256 numerator = (block.timestamp - lastUpdatedRewardAt) * COOLDOWN_CONSTANT;
            if (numerator < totalStakedAmt) revert CannotInteractWhenCoolingDown(block.timestamp, lastUpdatedRewardAt);

            uint256 alphaAccrued = numerator / totalStakedAmt;
            alphaNow = alphaNow + alphaAccrued;
        }

        uint256 accruedRewards = mapAddrToStakedAmt[msg.sender] * TOTAL_REWARDS_PER_SECOND
            * (alphaNow - mapAddrToAlphaAtLastUserInteraction[msg.sender]) / COOLDOWN_CONSTANT;
        mapAddrToPublishedReward[msg.sender] += accruedRewards;
        lastUpdatedRewardAt = block.timestamp;
    }
}
