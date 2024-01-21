// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.23;

import {FinthetixStakingToken} from "./FinthetixStakingToken.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

interface FSCErrors {
    /**
     * @notice Zero is not a valid amount of tokens to stake. If you
     *  wish to withdraw tokens, use the dedicated function.
     */
    error CannotStakeZeroAmount(address userAddr);

    /**
     * @notice Zero is not a valid amount of tokens to unstake.
     */
    error CannotUnstakeZeroAmount(address userAddr);

    /**
     * @notice Zero address is not supported
     */
    error InvalidUserAddress();

    /**
     * @notice User should not be able to unstake more than they have staked
     */
    error CannotUnstakeMoreThanStakedAmount(address userAddr, uint256 amtToUnstake, uint256 availableStakedBal);

    /**
     * @param currTimestamp The timestamp at which user has attempted to interact with contract.
     * @param lastUpdatedRewardAt The timestamp at which reward was last updated. i.e. last interaction timestamp.
     * @notice Users cannot interact with contract in cool-down period.
     *  The contract will unlock at ``lastUpdatedRewardAt + max(COOLDOWN_CONSTANT/totalStakedAmt, 1)`` timestamp
     */
    error CannotInteractWhenCoolingDown(uint256 currTimestamp, uint256 lastUpdatedRewardAt);

    // Commented out, since the boundary conditions required for this to be met are not reasonable (block.timestamp = 2e59 seconds)
    // You may uncomment and use this by deploying a new contract, once that day arises
    // /**
    //  * @param userAddr The address of the user who has triggered this error.
    //  * @notice This error occurs when the calculation of reward owed to the
    //  *  user triggers an overflow. Such high value users are requested to call
    //  *  the ``updateHighValueReward`` function
    //  */
    // error HighValueTransaction(address userAddr);
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
            // unless time > 1e57 (>3x age of universe!), we are safe from overflow [Why 1e57? type(uint256).max / COOLDOWN_CONSTANT]
            uint256 numerator = (block.timestamp - lastUpdatedRewardAt) * COOLDOWN_CONSTANT;
            if (numerator < totalStakedAmt) revert CannotInteractWhenCoolingDown(block.timestamp, lastUpdatedRewardAt);

            uint256 alphaAccrued = numerator / totalStakedAmt;
            alphaNow = alphaNow + alphaAccrued;
        }

        uint256 accruedRewards = _calculateAccruedRewards();
        mapAddrToPublishedReward[msg.sender] += accruedRewards;
        lastUpdatedRewardAt = block.timestamp;
    }

    function _calculateAccruedRewards() private view returns (uint256 result) {
        uint256 userStakedAmt = mapAddrToStakedAmt[msg.sender];

        (bool isProd1Safe, uint256 prod1) = Math.tryMul(userStakedAmt, TOTAL_REWARDS_PER_SECOND);
        if (!isProd1Safe) {
            // Ignoring the overflow possibility in the following two lines allows us to save some gas.

            /*  current TOTAL_REWARDS_PER_SECOND (ie. 5e17) and COOLDOWN_CONSTANT (ie. 1e20) cause their mutual 
                division to result in 5e-3. So even if the userStakedAmt is type(uint256).max, we will get a 
                smaller number on multiplying with the former.  */
            uint256 op1Result = Math.mulDiv(userStakedAmt, TOTAL_REWARDS_PER_SECOND, COOLDOWN_CONSTANT);
            /*  The below line will never overflow as the minimum alpha difference required to trigger overflow, 
                for the current COOLDOWN_CONSTANT is 2e59 seconds(>3 times the age of the universe) */
            return op1Result * (alphaNow - mapAddrToAlphaAtLastUserInteraction[msg.sender]);
        }

        /*  The below line will never overflow as the minimum alpha difference required to trigger overflow, 
            for the current COOLDOWN_CONSTANT is 2e59 seconds(>3 times the age of the universe) */
        return Math.mulDiv(prod1, (alphaNow - mapAddrToAlphaAtLastUserInteraction[msg.sender]), COOLDOWN_CONSTANT);
    }
}
