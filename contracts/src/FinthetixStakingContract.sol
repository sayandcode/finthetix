// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.23;

import {FinthetixStakingToken} from "src/FinthetixStakingToken.sol";
import {FinthetixRewardToken} from "src/FinthetixRewardToken.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title Finthetix Staking Contract Events
 * @author sayandcode
 * @notice The events emitted by the Finthetix Staking Contract
 */
interface FSCEvents {
    /**
     * @notice User has staked tokens
     * @param userAddr The address of the user who stakes
     * @param amtStaked The amount of tokens staked by user
     */
    event Staked(address indexed userAddr, uint256 amtStaked);

    /**
     * @notice User has unstaked tokens
     * @param userAddr The address of the user who unstakes
     * @param amtUnstaked The amount of tokens unstaked by user
     */
    event Unstaked(address indexed userAddr, uint256 amtUnstaked);

    /**
     * @notice User has withdrawn a reward
     * @param userAddr The address of the user who has withdrawn a reward
     * @param rewardAmt The reward amount withdrawn by the user
     */
    event RewardWithdrawn(address indexed userAddr, uint256 rewardAmt);

    /**
     * @notice The alpha has been updated
     * @dev This event is fired on every user interaction
     * @param newAlpha The updated alpha value
     */
    event AlphaUpdated(uint256 newAlpha);

    /**
     * @notice Reward has been published for a user
     * @dev This happens on every interaction of user with the contract
     * @param userAddr The address of the user who has interacted with the contract
     * @param newReward The new value of published reward for this user
     */
    event RewardPublished(address indexed userAddr, uint256 newReward);
}

interface FSCErrors {
    /**
     * @notice Zero is not a valid amount of tokens to stake/unstake.
     * @param userAddr The address of the interacting user
     */
    error CannotInteractWithZeroAmount(address userAddr);

    /**
     * @notice Cannot withdraw when no rewards are available for user
     * @param userAddr The address of the interacting user
     */
    error NoRewardsAvailable(address userAddr);

    /**
     * @notice Zero address is not supported
     */
    error InvalidUserAddress();

    /**
     * @notice User should not be able to unstake more than they have staked
     * @param userAddr The address of the interacting user
     * @param amtToUnstake The amount requested to unstake
     * @param availableStakedBal The available staked balance of this user
     */
    error CannotUnstakeMoreThanStakedAmount(address userAddr, uint256 amtToUnstake, uint256 availableStakedBal);

    /**
     * @notice Users cannot interact with contract in cool-down period.
     *  The contract will unlock at ``lastUpdatedRewardAt + max(COOLDOWN_CONSTANT/totalStakedAmt, 1)`` timestamp
     * @param currTimestamp The timestamp at which user has attempted to interact with contract.
     * @param lastUpdatedRewardAt The timestamp at which reward was last updated. i.e. last interaction timestamp.
     */
    error CannotInteractWhenCoolingDown(uint256 currTimestamp, uint256 lastUpdatedRewardAt);

    // Commented out, since the boundary conditions required for this to be met are not reasonable (block.timestamp = 2e59 seconds)
    // You may uncomment and use this by deploying a new contract, once that day arises
    // /**
    //  * @notice This error occurs when the calculation of reward owed to the
    //  *  user triggers an overflow. Such high value users are requested to call
    //  *  the ``updateHighValueReward`` function
    //  * @param userAddr The address of the user who has triggered this error.
    //  */
    // error HighValueTransaction(address userAddr);
}

/**
 * @title Finthetix Staking Contract
 * @author sayandcode
 * @notice Users can stake FST tokens and earn time based rewards. For more details refer README.md
 * @dev The errors and events are inherited from their respective interfaces
 */
contract FinthetixStakingContract is FSCEvents, FSCErrors {
    /**
     * @notice The total rewards granted every second
     */
    uint256 public constant TOTAL_REWARDS_PER_SECOND = 0.5 ether;

    /**
     * @notice The required total staked amount in the contract, for a cooldown period of 1 second.
     *  The cooldown time will be proportional to the number of tokens staked in
     *  the contract (Total Value Locked)
     *
     * @dev To calculate the cooldown time, get the TVL(totalStakedAmt) and divide by COOLDOWN_CONSTANT
     */
    uint256 public constant COOLDOWN_CONSTANT = 100 ether;

    /**
     * @notice The FST token used for staking with the contract
     */
    FinthetixStakingToken public immutable stakingToken;

    /**
     * @notice The FRT token granted as rewards for staking with the contract
     */
    FinthetixRewardToken public immutable rewardToken = new FinthetixRewardToken();

    /**
     * @notice The total amount of FST tokens staked with the contract
     * @dev The total FST tokens owned by the contract may be larger than this,
     *  due to no impediments in accepting FST tokens in normal ERC20 transfers.
     */
    uint256 public totalStakedAmt;

    /**
     * @notice The timestamp at which the reward was last updated
     */
    uint256 public lastUpdatedRewardAt;

    /**
     * @notice The current value of alpha
     */
    uint256 public alphaNow;

    /**
     * @dev A mapping of amount staked by each address
     */
    mapping(address => uint256) private mapAddrToStakedAmt;

    /**
     * @dev A mapping of reward published for each address
     */
    mapping(address => uint256) private mapAddrToPublishedReward;

    /**
     * @dev A mapping of alpha at last interaction of each address
     */
    mapping(address => uint256) private mapAddrToAlphaAtLastUserInteraction;

    /**
     * @dev Reverts if the sender is zero address
     */
    modifier onlyValidSender() {
        if (msg.sender == address(0)) revert InvalidUserAddress();
        _;
    }

    /**
     * @dev Used to prevent zero-amount interactions
     * @param amt The amount passed as parameter
     */
    modifier nonZeroAmt(uint256 amt) {
        if (amt == 0) revert CannotInteractWithZeroAmount(msg.sender);
        _;
    }

    /**
     * @param stakingTokenAddr The address of the FST token accepted by this contract for staking
     */
    constructor(address stakingTokenAddr) {
        stakingToken = FinthetixStakingToken(stakingTokenAddr);
    }

    /**
     * @notice Allows users to stake the specified number of tokens with the contract.
     * @notice The user is required to approve the FST ERC20 token transfer before calling this function.
     * @param amtToStake The additional amount user wishes to stake
     */
    function stake(uint256 amtToStake) external /* checks */ onlyValidSender nonZeroAmt(amtToStake) {
        // effects
        _updateReward();
        mapAddrToStakedAmt[msg.sender] += amtToStake;
        totalStakedAmt += amtToStake;

        // interactions
        stakingToken.transferFrom(msg.sender, address(this), amtToStake);
        emit Staked(msg.sender, amtToStake);
    }

    /**
     * @notice Allows users to unstake their staked tokens. This will transfer said number of tokens
     *  to the user's address
     * @param amtToUnstake The amount of tokens user wishes to unstake.
     */
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

    /**
     * @notice Allows the user to withdraw their earned rewards in the form of FRT tokens.
     * @dev This will transfer the entire reward amount as FRT(ERC20) tokens to the user's address
     */
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

    /**
     * @notice Allows the user to view the amount they have currently staked.
     * @return The amount currently staked by user
     */
    function viewMyStakedAmt() external view returns (uint256) {
        return mapAddrToStakedAmt[msg.sender];
    }

    /**
     * @notice Allows the user to view the amount of rewards already published/awarded to them
     * @dev This doesn't include rewards earned since last interaction. That will be accrued when
     *  user interacts again (``stake``/``unstake``/``withdrawReward``)
     * @return The amount of rewards currently published/awarded to user
     */
    function viewMyPublishedRewards() external view returns (uint256) {
        return mapAddrToPublishedReward[msg.sender];
    }

    /**
     * @notice Allows user to view the value of alpha at their last interaction
     * @dev This helps to calculate the rewards off-chain, so that users can track their live rewards status
     *  without paying gas.
     * @return The alpha at last user interaction
     */
    function viewAlphaAtMyLastInteraction() external view returns (uint256) {
        return mapAddrToAlphaAtLastUserInteraction[msg.sender];
    }

    /**
     * @dev Updates the reward as well as other associated counters
     * @dev This function is supposed to be called internally at every user interaction
     *  i.e. at every interaction that changes the staked amount. This function updates the alpha and the
     *  rewards published for the user(msg.sender)
     */
    function _updateReward() private {
        alphaNow += _calculateAccruedAlpha();
        emit AlphaUpdated(alphaNow);
        mapAddrToPublishedReward[msg.sender] += _calculateAccruedRewards();
        emit RewardPublished(msg.sender, mapAddrToPublishedReward[msg.sender]);
        lastUpdatedRewardAt = block.timestamp;
        mapAddrToAlphaAtLastUserInteraction[msg.sender] = alphaNow;
    }

    /**
     * @dev Calculates the alpha accrued since the last interaction.
     * @dev We have ignored some amount of runtime safety under the assumption that those conditions are
     *  highly unlikely. Namely, we have not accomodated timestamp  values larger than 1e57 seconds, as
     *  this an extremely unlikely scenario (more than 3x the age of universe)
     */
    function _calculateAccruedAlpha() private view returns (uint256) {
        if (totalStakedAmt == 0) return 0;

        // unless time > 1e57 (>3x age of universe!), we are safe from overflow
        // [Why 1e57? type(uint256).max / COOLDOWN_CONSTANT]
        uint256 numerator = (block.timestamp - lastUpdatedRewardAt) * COOLDOWN_CONSTANT;
        if (numerator < totalStakedAmt) revert CannotInteractWhenCoolingDown(block.timestamp, lastUpdatedRewardAt);
        return numerator / totalStakedAmt;
    }

    /**
     * @dev Calculates the rewards accrued since the last interaction of user.
     * @dev This assumes that the alpha value is up to date, by calculating the alpha relevant to
     *  the current ``block.timestamp``. This is merely a helper function meant to be used as part of the
     *  ``_updateReward`` function.
     * @dev We have ignored several overflow conditions under the assumption that these are highly unlikely
     *  to occur. Namely, we have ignored values of ``block.timestamp`` greater than 2e59 seconds.
     */
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
