// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.23;

import {FinthetixStakingToken} from "src/FinthetixStakingToken.sol";
import {FinthetixRewardToken} from "src/FinthetixRewardToken.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

interface FSCEvents {
    event Staked(address indexed userAddr, uint256 amtStaked);
    event Unstaked(address indexed userAddr, uint256 amtUnstaked);
    event RewardWithdrawn(address indexed userAddr, uint256 rewardAmt);
    event AlphaUpdated(uint256 newAlpha);
    event RewardUpdated(address indexed userAddr, uint256 newReward);
}

interface FSCErrors {
    /**
     * @notice Zero is not a valid amount of tokens to stake/unstake.
     */
    error CannotInteractWithZeroAmount(address userAddr);

    /**
     * @notice Cannot withdraw when no rewards are available for user
     */
    error NoRewardsAvailable(address userAddr);

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

contract FinthetixStakingContract is FSCEvents, FSCErrors {
    uint256 public constant TOTAL_REWARDS_PER_SECOND = 0.5 ether;
    /**
     * @notice The required total staked amount in the contract, for a cooldown period of 1 second.
     *  The cooldown time will be proportional to the number of tokens staked in the contract (Total Value Locked)
     *
     * @dev To calculate the cooldown time, get the TVL(totalStakedAmt) and divide by COOLDOWN_CONSTANT
     */
    uint256 public constant COOLDOWN_CONSTANT = 100 ether;
    FinthetixStakingToken public immutable stakingToken;
    FinthetixRewardToken public immutable rewardToken = new FinthetixRewardToken();
    uint256 public totalStakedAmt;
    uint256 public lastUpdatedRewardAt;
    uint256 public alphaNow;

    mapping(address => uint256) private mapAddrToStakedAmt;
    mapping(address => uint256) private mapAddrToPublishedReward;
    mapping(address => uint256) private mapAddrToAlphaAtLastUserInteraction;

    modifier onlyValidSender() {
        if (msg.sender == address(0)) revert InvalidUserAddress();
        _;
    }

    modifier nonZeroAmt(uint256 amt) {
        if (amt == 0) revert CannotInteractWithZeroAmount(msg.sender);
        _;
    }

    constructor(address stakingTokenAddr) {
        stakingToken = FinthetixStakingToken(stakingTokenAddr);
    }

    function stake(uint256 amtToStake) external /* checks */ onlyValidSender nonZeroAmt(amtToStake) {
        // effects
        _updateReward();
        mapAddrToStakedAmt[msg.sender] += amtToStake;
        totalStakedAmt += amtToStake;

        // interactions
        stakingToken.transferFrom(msg.sender, address(this), amtToStake);
        emit Staked(msg.sender, amtToStake);
    }

    function unstake(uint256 amtToUnstake) external /* checks */ onlyValidSender nonZeroAmt(amtToUnstake) {
        // checks
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
        emit Unstaked(msg.sender, amtToUnstake);
    }

    function withdrawRewards() external onlyValidSender {
        _updateReward();
        uint256 rewardBal = mapAddrToPublishedReward[msg.sender];

        // checks
        if (rewardBal == 0) revert NoRewardsAvailable(msg.sender);

        // effects
        mapAddrToPublishedReward[msg.sender] = 0;

        // interactions
        rewardToken.mint(msg.sender, rewardBal);
        emit RewardWithdrawn(msg.sender, rewardBal);
    }

    function viewMyStakedAmt() external view returns (uint256) {
        return mapAddrToStakedAmt[msg.sender];
    }

    function viewMyPublishedRewards() external view returns (uint256) {
        return mapAddrToPublishedReward[msg.sender];
    }

    function viewAlphaAtMyLastInteraction() external view returns (uint256) {
        return mapAddrToAlphaAtLastUserInteraction[msg.sender];
    }

    function _updateReward() private {
        alphaNow += _calculateAccruedAlpha();
        emit AlphaUpdated(alphaNow);
        mapAddrToPublishedReward[msg.sender] += _calculateAccruedRewards();
        emit RewardUpdated(msg.sender, mapAddrToPublishedReward[msg.sender]);
        lastUpdatedRewardAt = block.timestamp;
        mapAddrToAlphaAtLastUserInteraction[msg.sender] = alphaNow;
    }

    function _calculateAccruedAlpha() private view returns (uint256) {
        if (totalStakedAmt == 0) return 0;

        // unless time > 1e57 (>3x age of universe!), we are safe from overflow
        // [Why 1e57? type(uint256).max / COOLDOWN_CONSTANT]
        uint256 numerator = (block.timestamp - lastUpdatedRewardAt) * COOLDOWN_CONSTANT;
        if (numerator < totalStakedAmt) revert CannotInteractWhenCoolingDown(block.timestamp, lastUpdatedRewardAt);
        return numerator / totalStakedAmt;
    }

    function _calculateAccruedRewards() private view returns (uint256) {
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
