// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.23;

import {FinthetixStakingContract, FSCEvents, FSCErrors} from "src/FinthetixStakingContract.sol";
import {FinthetixStakingToken} from "src/FinthetixStakingToken.sol";
import {FinthetixRewardToken} from "src/FinthetixRewardToken.sol";
import {Test, console} from "forge-std/Test.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

contract FinthetixStakingContract_UnitTest is Test {
    /**
     * @dev The random input used for test_IndividualAndTotalStakedBalancesAreUpdated
     */
    struct Arg0_IndividualAndTotalStakedBalancesAreUpdated {
        address userAddr;
        uint128 amtToStake;
        uint128 amtToUnstake;
    }

    /**
     * @dev The obtained rewards will never be bigger than the rewards owed.
     *  i.e. The precision loss is downwards
     */
    uint256 REWARD_PRECISION;
    FinthetixStakingContract stakingContract;
    FinthetixStakingToken stakingToken;
    FinthetixRewardToken rewardToken;

    /**
     * @param userAddr The address of the user who has triggered this error.
     * @notice This error occurs when the calculation of reward owed to the
     *  user triggers an overflow. Such high value users are requested to call
     *  the ``updateHighValueReward`` function
     */
    error HighValueTransaction(address userAddr);

    function setUp() public {
        stakingToken = new FinthetixStakingToken();
        stakingContract = new FinthetixStakingContract(address(stakingToken));
        rewardToken = stakingContract.rewardToken();
        REWARD_PRECISION = stakingContract.TOTAL_REWARDS_PER_SECOND() * 2;
    }

    /**
     * @notice Tests if the contract indeed has a token
     *  associated with it for staking.
     */
    function test_HasStakingTokens() public {
        assertEq(stakingToken.balanceOf(address(this)), 0, "FST balance of test contract is not accurate");
    }

    /**
     *
     * @param amtToStake The amount of tokens to stake with the contract
     * @param userAddr The address of the user
     * @notice Tests whether the token balances are updated on the ERC20
     *  side whenever there is a staking/unstaking action
     */
    function test_StakingTransfersTokensBetweenUserAndStakingContract(uint128 amtToStake, address userAddr) public {
        // assumptions
        vm.assume(userAddr != address(0) && amtToStake != 0);

        // definitions
        address stakingContractAddr = address(stakingContract);

        // setup
        deal(address(stakingToken), userAddr, amtToStake, true);
        uint256 tokenBal1OfStakingContract = stakingToken.balanceOf(stakingContractAddr);
        uint256 tokenBal1OfUser = stakingToken.balanceOf(userAddr);

        // act 1 - stake
        _approveAndStake(userAddr, amtToStake, false);

        // verify 1
        uint256 tokenBal2OfStakingContract = stakingToken.balanceOf(stakingContractAddr);
        uint256 tokenBal2OfUser = stakingToken.balanceOf(userAddr);
        uint256 expectedTokenBal2OfStakingContract = tokenBal1OfStakingContract + amtToStake;
        uint256 expectedTokenBal2OfUser = tokenBal1OfUser - amtToStake;
        assertEq(
            tokenBal2OfStakingContract,
            expectedTokenBal2OfStakingContract,
            "Staking did not increase token balance of staking contract"
        );
        assertEq(tokenBal2OfUser, expectedTokenBal2OfUser, "Staking did not decrease token balance of user");

        // setup 2
        _waitForCoolDown();

        // act 2 - unstake
        vm.prank(userAddr);
        stakingContract.unstake(amtToStake);

        // verify 2
        uint256 tokenBal3OfStakingContract = stakingToken.balanceOf(stakingContractAddr);
        uint256 tokenBal3OfUser = stakingToken.balanceOf(userAddr);
        assertEq(
            tokenBal3OfStakingContract,
            tokenBal1OfStakingContract,
            "Unstaking did not decrease token balance of staking contract"
        );
        assertEq(tokenBal3OfUser, tokenBal1OfUser, "Unstaking did not increase token balance of user");
    }

    /**
     * @notice Tests that users cannot stake 0 amount
     */
    function test_CanNotStakeInvalidAmt() public {
        // setup
        address userAddr = vm.addr(0xB0b);
        uint64 initTokenBalForUser = 10 ether;
        deal(address(stakingToken), userAddr, initTokenBalForUser, true);
        vm.startPrank(userAddr);
        stakingToken.approve(address(stakingContract), initTokenBalForUser);

        // act & verify
        vm.expectRevert(abi.encodeWithSelector(FSCErrors.CannotInteractWithZeroAmount.selector, userAddr));
        stakingContract.stake(0);
        vm.stopPrank();
    }

    /**
     * @notice Tests that users cannot stake 0 amount
     */
    function test_CanNotUnstakeInvalidAmt() public {
        // setup
        address userAddr = vm.addr(0xB0b);
        uint64 initTokenBalForUser = 10 ether;
        _approveAndStake(userAddr, initTokenBalForUser, true);

        // act & verify
        vm.prank(userAddr);
        vm.expectRevert(abi.encodeWithSelector(FSCErrors.CannotInteractWithZeroAmount.selector, userAddr));
        stakingContract.unstake(0);
    }

    /**
     * @param _amtToStake The amount staked initially (unbounded)
     * @param _amtToUnstake The amount attempted to unstake (unbounded)
     * @notice Tests that error is thrown if trying to withdraw more than
     *  staked amount
     */
    function test_CannotUnStakeMoreThanStakedAmount(uint248 _amtToStake, uint248 _amtToUnstake) public {
        // assumptions
        uint256 boundedAmtToStake = bound(_amtToStake, 1, type(uint256).max - 1);
        uint256 boundedAmtToUnstake = bound(_amtToUnstake, boundedAmtToStake + 1, type(uint256).max); // unstake more than staked amt

        // setup
        address userAddr = vm.addr(0xB0b);
        _approveAndStake(userAddr, boundedAmtToStake, true);

        // act & verify
        vm.prank(userAddr);
        vm.expectRevert(
            abi.encodeWithSelector(
                FSCErrors.CannotUnstakeMoreThanStakedAmount.selector, userAddr, boundedAmtToUnstake, boundedAmtToStake
            )
        );
        stakingContract.unstake(boundedAmtToUnstake);
    }

    /**
     * @notice Tests that zero address cannot stake
     */
    function test_CanNotStakeFromInvalidAddr() public {
        // setup
        address userAddr = address(0);
        uint64 initTokenBalForUser = 10 ether;
        deal(address(stakingToken), userAddr, initTokenBalForUser, true);
        vm.startPrank(userAddr);

        // act & verify
        vm.expectRevert(FSCErrors.InvalidUserAddress.selector);
        stakingContract.stake(0);
        vm.stopPrank();
    }

    /**
     * @notice Tests that zero address cannot unstake
     */
    function test_CanNotUnstakeFromInvalidAddr() public {
        // setup
        uint256 amtToUnstake = 10 ether;

        // act & verify
        vm.prank(address(0));
        vm.expectRevert(FSCErrors.InvalidUserAddress.selector);
        stakingContract.unstake(amtToUnstake);
    }

    /**
     *
     * @param arg0 An array of inputs containing user address, amount to stake and amount to unstake.
     *  This gives us a random list of users to interact with the staking contract, using the given parameters.
     * @notice This tests whether staking and unstaking actions of the users updates both the individual as well
     *  as total staked balances maintained in the staking contract.
     */
    function test_IndividualAndTotalStakedBalancesAreUpdated(
        Arg0_IndividualAndTotalStakedBalancesAreUpdated[] calldata arg0
    ) public {
        // assumptions
        Arg0_IndividualAndTotalStakedBalancesAreUpdated[] memory refinedArg0 =
            _refineArg0_IndividualAndTotalStakedbalancesAreUpdated(arg0);

        uint256 expectedTotalStakedBal = 0;
        for (uint256 i = 0; i < refinedArg0.length; i++) {
            // setup 1
            address userAddr = refinedArg0[i].userAddr;
            uint256 amtToStake = refinedArg0[i].amtToStake;
            uint256 amtToUnstake = refinedArg0[i].amtToUnstake;
            vm.prank(userAddr);
            uint256 preStakeBal = stakingContract.viewMyStakedAmt();

            // act 1 - stake
            _approveAndStake(userAddr, amtToStake, true);

            // verify 1 - stake
            expectedTotalStakedBal += amtToStake;
            assertEq(stakingContract.totalStakedAmt(), expectedTotalStakedBal, "Total amt staked has not increased");
            vm.prank(userAddr);
            uint256 postStakeBal = stakingContract.viewMyStakedAmt();
            uint256 expectedPostStakeBal = preStakeBal + amtToStake;
            assertEq(postStakeBal, expectedPostStakeBal, "The post-staking balance for user is accurate");

            // cleanup 1 - stake
            _waitForCoolDown();

            // act 2 - unstake
            vm.prank(userAddr);
            stakingContract.unstake(amtToUnstake);

            // verify 2 - unstake
            expectedTotalStakedBal -= amtToUnstake;
            assertEq(stakingContract.totalStakedAmt(), expectedTotalStakedBal, "Total amt staked has not decreased");
            vm.prank(userAddr);
            uint256 postUnstakeBal = stakingContract.viewMyStakedAmt();
            uint256 expectedUserBal = expectedPostStakeBal - amtToUnstake;
            assertEq(postUnstakeBal, expectedUserBal, "The post-unstaking balance for user is accurate");

            // cleanup 2 - unstake
            _waitForCoolDown();
        }
    }

    /**
     *
     * @param userAddr The address whose reward balance you wish to check
     * @notice Tests whether addresses start off with zero rewards
     */
    function test_InitialRewardsIsZero(address userAddr) public {
        // assumptions
        vm.assume(userAddr != address(0));

        // act
        vm.prank(userAddr);
        uint256 accruedRewards = stakingContract.viewMyPublishedRewards();

        // verify
        assertEq(accruedRewards, 0, "Initial accrued rewards should be 0");
    }

    function test_CanAccrueRewards(uint128 _amtToStake1, uint128 _amtToStake2) public {
        // assumptions
        vm.assume(_amtToStake1 > 0 && _amtToStake2 > 0);
        uint256 amtToStake1 = uint256(_amtToStake1);
        uint256 amtToStake2 = uint256(_amtToStake2);

        // definitions
        /// We check rewards for user2 so that user1 is used to set up the env
        /// Namely we want the alphaAtLastUserInteraction to be updated correctly
        uint256 expectedRewardsForUser2;
        uint256 lastInteractedTime;

        // setup
        /// user 1 stakes
        address userAddr1 = vm.addr(0xB0b);
        address userAddr2 = vm.addr(0xAbe);
        _approveAndStake(userAddr1, amtToStake1, true);
        _waitForCoolDown();

        /// user 2 stakes
        _approveAndStake(userAddr2, amtToStake2, true);
        lastInteractedTime = block.timestamp;
        _waitForCoolDown();

        /// user 1 unstakes
        vm.prank(userAddr1);
        stakingContract.unstake(amtToStake1);
        uint256 totalStakedAmt = amtToStake1 + amtToStake2;
        expectedRewardsForUser2 += (
            amtToStake2 * stakingContract.TOTAL_REWARDS_PER_SECOND() * (block.timestamp - lastInteractedTime)
        ) / (totalStakedAmt);
        lastInteractedTime = block.timestamp;
        _waitForCoolDown();

        /// user2 unstakes
        vm.prank(userAddr2);
        stakingContract.unstake(amtToStake2);
        expectedRewardsForUser2 += stakingContract.TOTAL_REWARDS_PER_SECOND() * (block.timestamp - lastInteractedTime);
        _waitForCoolDown();

        // act & verify
        vm.prank(userAddr2);
        uint256 accruedRewards = stakingContract.viewMyPublishedRewards();

        assert(expectedRewardsForUser2 - accruedRewards < REWARD_PRECISION);
    }

    /**
     *
     * @param timeToWait The time to wait between staking interactions
     * @notice Tests whether the ``lastUpdatedRewardAt`` timestamp is updated during staking
     */
    function test_StakingUpdatesLastUpdatedTimestamp(uint128 timeToWait) public {
        // assumptions
        vm.assume(timeToWait > 0);

        // setup
        address userAddr = vm.addr(0xB0b);
        uint256 amtToStake = 10 ether;
        uint256 newTime = block.timestamp + timeToWait;
        vm.warp(newTime);

        // act
        _approveAndStake(userAddr, amtToStake, true);

        // verify
        assertEq(stakingContract.lastUpdatedRewardAt(), newTime, "Staking doesn't update lastUpdatedRewardAt");
    }

    /**
     *
     * @param timeToWait The time to wait before unstaking
     * @notice Tests whether the ``lastUpdatedRewardAt`` timestamp is updated during unstaking
     */
    function test_UnstakingUpdatesLastUpdatedTimestamp(uint128 timeToWait) public {
        // assumptions
        vm.assume(timeToWait > 0);
        uint256 amtToStake = 20 ether;
        vm.assume(uint256(timeToWait) * stakingContract.COOLDOWN_CONSTANT() > amtToStake);

        // setup
        address userAddr = vm.addr(0xB0b);
        _approveAndStake(userAddr, amtToStake, true);
        uint256 newTime = block.timestamp + timeToWait;
        vm.warp(newTime);

        // act
        vm.prank(userAddr);
        stakingContract.unstake(amtToStake / 2);

        // verify
        assertEq(stakingContract.lastUpdatedRewardAt(), newTime, "Staking doesn't update lastUpdatedRewardAt");
    }

    /**
     *
     * @param initAmtToStake The first amount to stake
     * @param timeToWait The time to wait before attempting staking once again
     * @notice Tests whether staking is prevented during cooldown phase
     */
    function test_CannotStakeInCoolDownPhase(uint128 initAmtToStake, uint128 timeToWait) public {
        // assumptions
        vm.assume(initAmtToStake > 0 && timeToWait > 0);
        vm.assume(stakingContract.COOLDOWN_CONSTANT() * uint256(timeToWait) < uint256(initAmtToStake));

        // setup
        address userAddr = vm.addr(0xB0b);
        uint256 amtToApprove = type(uint256).max;
        deal(address(stakingToken), userAddr, amtToApprove, true);
        vm.prank(userAddr);
        stakingToken.approve(address(stakingContract), amtToApprove);
        vm.prank(userAddr);
        stakingContract.stake(initAmtToStake);
        uint256 initTime = block.timestamp;
        uint256 newTime = initTime + timeToWait;
        vm.warp(newTime);

        // act & verify
        vm.prank(userAddr);
        vm.expectRevert(abi.encodeWithSelector(FSCErrors.CannotInteractWhenCoolingDown.selector, newTime, initTime));
        stakingContract.stake(1);
    }

    /**
     *
     * @param initAmtToStake The first amount to stake
     * @param timeToWait The time to wait before attempting staking once again
     * @notice Tests whether unstaking is prevented during cooldown phase
     */
    function test_CannotUnstakeInCooldownPhase(uint128 initAmtToStake, uint128 timeToWait) public {
        // assumptions
        vm.assume(initAmtToStake > 2 && timeToWait > 0);
        vm.assume(uint256(timeToWait) * stakingContract.COOLDOWN_CONSTANT() < initAmtToStake);

        // setup
        address userAddr = vm.addr(0xB0b);
        _approveAndStake(userAddr, initAmtToStake, true);
        uint256 initTime = block.timestamp;
        uint256 newTime = initTime + timeToWait;
        vm.warp(newTime);
        uint256 amtToUnstake = 1; // the minimum amount is fine, as we just want to trigger the checks

        // act & verify
        vm.expectRevert(abi.encodeWithSelector(FSCErrors.CannotInteractWhenCoolingDown.selector, newTime, initTime));
        vm.prank(userAddr);
        stakingContract.unstake(amtToUnstake);
    }

    /**
     *
     * @param initAmtToStake The first amount to stake. This decides
     *  the ``timeToWait`` as well as the computed ``alphaNow`` value
     * @param timeToWait The time to wait before staking again with the staking contract
     */
    function test_StakingUpdatesAlphaNow(uint128 initAmtToStake, uint128 timeToWait) public {
        // assumptions
        vm.assume(initAmtToStake != 0);
        vm.assume((stakingContract.COOLDOWN_CONSTANT() * timeToWait > initAmtToStake));

        // setup
        address userAddr1 = vm.addr(0xB0b);
        _approveAndStake(userAddr1, initAmtToStake, true);
        uint256 initAlphaNow = stakingContract.alphaNow();
        vm.warp(block.timestamp + timeToWait);

        // act
        uint256 secondAmtToStake = 1;
        _approveAndStake(userAddr1, secondAmtToStake, true);

        // verify
        uint256 expectedAlphaNow = initAlphaNow + (stakingContract.COOLDOWN_CONSTANT() * timeToWait) / initAmtToStake; // the reward is updated without including balance from new stake info
        assertEq(stakingContract.alphaNow(), expectedAlphaNow, "Staking doesn't update alphaNow");
    }

    /**
     *
     * @param initAmtToStake The first amount to stake. This decides
     *  the ``timeToWait`` as well as the computed ``alphaNow`` value
     * @param timeToWait The time to wait before staking again with the staking contract
     */
    function test_UnstakingUpdatesAlphaNow(uint128 initAmtToStake, uint128 timeToWait) public {
        // assumptions
        uint256 secondAmtToStake = 1;
        vm.assume(initAmtToStake > secondAmtToStake);
        vm.assume((stakingContract.COOLDOWN_CONSTANT() * timeToWait > initAmtToStake));

        // setup
        address userAddr1 = vm.addr(0xB0b);
        _approveAndStake(userAddr1, initAmtToStake, true);
        uint256 initAlphaNow = stakingContract.alphaNow();
        vm.warp(block.timestamp + timeToWait);

        // act
        vm.prank(userAddr1);
        stakingContract.unstake(1);

        // verify
        uint256 expectedAlphaNow = initAlphaNow + (stakingContract.COOLDOWN_CONSTANT() * timeToWait) / initAmtToStake; // the reward is updated without including balance from new stake info
        assertEq(stakingContract.alphaNow(), expectedAlphaNow, "Staking doesn't update alphaNow");
    }

    /**
     * @notice Tests whether phantom overflow in reward calculation is handled.
     * @dev By setting the amount staked high enough, we manage to trigger overflow on
     * the first product in rewards calculation
     */
    function test_CanHandlePhantomOverflowInRewardCalc() public {
        // setup
        uint256 amtToStake = type(uint256).max / stakingContract.TOTAL_REWARDS_PER_SECOND() + 1; // makes the first product (mapAddrToStakedAmt[msg.sender] * TOTAL_REWARDS_PER_SECOND) overflow
        address userAddr = vm.addr(0xB0b);
        _approveAndStake(userAddr, amtToStake, true);
        _waitForCoolDown();

        // act & verify
        uint256 minUnstakeAmt = 1;
        vm.prank(userAddr);
        stakingContract.unstake(minUnstakeAmt);
    }

    /**
     * @notice Tests the overflow handling in alpha calculation
     * @dev This test has been disabled (private), as the required time period
     *  to trigger the overflow for the current COOLDOWN_CONSTANT of 1e20 is more
     *  than 1e57 (>3 times the age of the universe!), which doesn't need to be
     *  accounted for
     */
    function test_CanHandleActualOverflowInAlphaCalc() private {
        // setup
        /// minimum amount of stake, as we are trying to accomodate highest
        /// possible alpha value. The two are inversely proportional
        uint256 amtToStake = 1;
        address userAddr = vm.addr(0xB0b);
        _approveAndStake(userAddr, amtToStake, true);
        uint256 minWaitTimeToOverflowAlphaCalc = type(uint256).max / stakingContract.COOLDOWN_CONSTANT() + 1;
        vm.warp(block.timestamp + minWaitTimeToOverflowAlphaCalc);

        // act & verify
        uint256 minUnstakeAmtToTriggerAlphaCalc = 1;
        vm.expectRevert(abi.encodeWithSelector(HighValueTransaction.selector, userAddr));
        vm.prank(userAddr);
        stakingContract.unstake(minUnstakeAmtToTriggerAlphaCalc);
    }

    /**
     * @notice Tests the overflow handling in rewards calculation, under the
     *  constraints of minimum staked amount required to trigger. Obviously that
     *  means alpha which depends on the time is leading the overflow trigger
     * @dev This test has been disabled (private), as the required time period
     *  to trigger the overflow for the current TOTAL_REWARDS_PER_SECOND of 5e17
     *  is more than 2e59 (3 times the age of the universe!), which doesn't need
     *  to be accounted for
     */
    function test_CanHandleActualOverflowInRewardCalc_AlphaLeads() private {
        // setup
        uint256 amtToStake = type(uint256).max / stakingContract.TOTAL_REWARDS_PER_SECOND() + 1; // overflows prod1
        address userAddr = vm.addr(0xB0b);
        _approveAndStake(userAddr, amtToStake, true);

        /// To overflow the reward calculation wait until
        /// alphaDiff * op1 > type(uint256).max
        /// alphaDiff * ((type(uint256).max/ TOTAL_REWARDS_PER_SECOND) * TOTAL_REWARDS_PER_SECOND / COOLDOWN_CONSTANT) > type(uint256).max
        /// alphaDiff * ((type(uint256).max) / COOLDOWN_CONSTANT) > type(uint256).max
        /// alphaDiff * ((1 / COOLDOWN_CONSTANT) > 1
        /// alphaDiff > COOLDOWN_CONSTANT
        /// (t * COOLDOWN_CONSTANT / amtStaked) > COOLDOWN_CONSTANT
        /// t > amtStaked
        uint256 timeToWaitToOverflowAlpha = amtToStake + 1;
        vm.warp(block.timestamp + timeToWaitToOverflowAlpha);

        // act & verify
        uint256 minUnstakeAmtToTriggerRewardCalc = 1;
        vm.expectRevert(abi.encodeWithSelector(HighValueTransaction.selector, userAddr));
        vm.prank(userAddr);
        stakingContract.unstake(minUnstakeAmtToTriggerRewardCalc);
    }

    /**
     * @notice Tests the overflow handling in rewards calculation, under the
     *  constraints of minimum alpha (or by extension, time) required to trigger.
     *  Obviously that means staked amount by user is leading the overflow
     *  trigger
     * @dev This test has been disabled (private), as the required time period
     *  to trigger the overflow for the current TOTAL_REWARDS_PER_SECOND of 5e17
     *  is more than 2e59 seconds (3 times the age of the universe!), which doesn't
     *  need to be accounted for
     */
    function test_CanHandleActualOverflowInRewardCalc_StakedAmtLeads() private {
        // setup
        uint256 amtToStake = type(uint256).max; // the max possible staked amount is used
        address userAddr = vm.addr(0xB0b);
        _approveAndStake(userAddr, amtToStake, true);
        _waitForCoolDown();

        // act & verify
        uint256 minUnstakeAmtToTriggerRewardCalc = 1;
        vm.expectRevert(abi.encodeWithSelector(HighValueTransaction.selector, userAddr));
        vm.prank(userAddr);
        stakingContract.unstake(minUnstakeAmtToTriggerRewardCalc);
    }

    /**
     * @notice Tests the overflow handling in rewards calculation, under the expectation that total earned
     * rewards will exceed type(uint256).max.
     * @dev This test has been disabled (private), as the required time period
     *  to trigger the overflow for the current TOTAL_REWARDS_PER_SECOND of 5e17
     *  is more than 2e59 seconds (>3 times the age of the universe!), which doesn't
     *  need to be accounted for
     */
    function test_CanHandleActualOverflowInRewardCalc_OverallRewardExceedsBounds() private {
        // setup
        uint256 amtToStake = type(uint256).max / stakingContract.TOTAL_REWARDS_PER_SECOND(); // *doesn't* overflow prod1
        address userAddr = vm.addr(0xB0b);
        _approveAndStake(userAddr, amtToStake, true);

        /// To overflow the reward calculation
        /// (amtToStake * TOTAL_REWARD_PER_SECOND * alphaDiff) / COOLDOWN_CONSTANT > type(uint256).max
        /// (type(uint256).max * alphaDiff) / COOLDOWN > type(uint256).max
        /// (1 * alphaDiff) / COOLDOWN > 1
        /// (alphaDiff) > COOLDOWN
        /// (t * COOLDOWN_CONSTANT / amtToStake) > COOLDOWN_CONSTANT
        /// (t * 1 / amtToStake) > 1
        /// t > amtToStake
        uint256 timeToWait = amtToStake + 1;
        vm.warp(block.timestamp + timeToWait + 1);

        // act & verify
        uint256 minAmtToUnstakeToTriggerRewardCalc = 1; // the minimum amount is fine, as we just want to trigger reward calc
        vm.expectRevert(abi.encodeWithSelector(HighValueTransaction.selector, userAddr));
        vm.prank(userAddr);
        stakingContract.unstake(minAmtToUnstakeToTriggerRewardCalc);
    }

    /**
     * @notice Tests whether reward can be withdrawn as reward tokens (FRT)
     * @dev The ``amtToStake`` has been limited to uint248 as we don't want to
     *  trigger the overflow in alpha calculation. The overflow in alpha
     *  calculation is not relevant as the associated block timestamp is greater
     *  than the age of the universe.
     */
    function test_CanWithdrawRewards(uint248 amtToStake) public {
        // assume
        vm.assume(amtToStake > 0);

        // setup
        address userAddr = vm.addr(0xB0b);
        _approveAndStake(userAddr, amtToStake, true);
        _waitForCoolDown();
        vm.startPrank(userAddr);
        stakingContract.unstake(amtToStake);
        uint256 expectedRewards = stakingContract.viewMyPublishedRewards(); // calculation accuracy is handled by a different test (`test_CanAccrueRewards`)
        uint256 initFRTBal = rewardToken.balanceOf(userAddr);

        // act
        stakingContract.withdrawRewards();

        // verify
        uint256 finalFRTBal = rewardToken.balanceOf(userAddr);
        assertEq(finalFRTBal - initFRTBal, expectedRewards, "Reward tokens received are not as expected");
        assertEq(stakingContract.viewMyPublishedRewards(), 0, "Rewards have not been reset post withdrawal");

        vm.stopPrank();
    }

    /**
     * @notice Tests whether user is given error when withdrawing non existent
     *  reward
     */
    function test_CannotWithdrawWithoutRewards() public {
        address userAddr = vm.addr(0xB0b);
        vm.expectRevert(abi.encodeWithSelector(FSCErrors.NoRewardsAvailable.selector, userAddr));
        vm.prank(userAddr);
        stakingContract.withdrawRewards();
    }

    /**
     * @notice Tests that zero address is not allowed to withdraw rewards
     */
    function test_CannotWithdrawRewardsFromInvalidAddress() public {
        address userAddr = address(0);
        vm.expectRevert(FSCErrors.InvalidUserAddress.selector);
        vm.prank(userAddr);
        stakingContract.withdrawRewards();
    }

    /**
     * @notice Tests that on requesting a withdrawal, user receives the latest
     *  reward balance. This means the reward needs to be updated internally
     *  before withdrawal is initiated.
     */
    function test_WithdrawalObtainsLatestRewards(uint128 amtToStake) public {
        // assume
        vm.assume(amtToStake > 0);

        // setup
        address userAddr = vm.addr(0xB0b);
        _approveAndStake(userAddr, amtToStake, true);
        uint256 timeOfStaking = block.timestamp;
        _waitForCoolDown();
        uint256 initFRTBal = rewardToken.balanceOf(userAddr);

        // act
        vm.prank(userAddr);
        stakingContract.withdrawRewards();

        // verify
        uint256 expectedRewards = stakingContract.TOTAL_REWARDS_PER_SECOND() * (block.timestamp - timeOfStaking);
        uint256 obtainedRewards = rewardToken.balanceOf(userAddr) - initFRTBal;
        assert(expectedRewards - obtainedRewards < REWARD_PRECISION); // else "Reward tokens were not updated when withdrawing"
    }

    /**
     * @param userAddr Address of user who stakes
     * @param amtToStake1 Amt initially staked in the contract before main interaction.
     *  This helps to test variations in alpha and rewards owed.
     * @param amtToStake2 Amt staked for main interaction.
     * @notice Tests that staking emits the relevant events.
     * @dev We stake an initial amount so that we can vary the alpha and
     *  rewards, and check that event data is as expected
     */
    function test_StakingHasEvents(address userAddr, uint8 amtToStake1, uint248 amtToStake2) public {
        // assumptions
        vm.assume(userAddr != address(0) && amtToStake1 > 0 && amtToStake2 > 0);

        // setup
        _approveAndStake(userAddr, amtToStake1, true); // stake initial amount for varying alpha and rewards
        _waitForCoolDown();
        deal(address(stakingToken), userAddr, amtToStake2, true);
        vm.prank(userAddr);
        stakingToken.approve(address(stakingContract), amtToStake2);

        // act & verify
        uint256 expectedNewAlpha = _getExpectedNewAlpha();
        vm.expectEmit(false, false, false, true, address(stakingContract));
        emit FSCEvents.AlphaUpdated(expectedNewAlpha);

        uint256 expectedNewUserReward = _getExpectedNewUserReward(userAddr);
        vm.expectEmit(true, false, false, true, address(stakingContract));
        emit FSCEvents.RewardUpdated(userAddr, expectedNewUserReward);

        vm.expectEmit(true, true, false, true, address(stakingContract));
        emit FSCEvents.Staked(userAddr, amtToStake2);

        vm.prank(userAddr);
        stakingContract.stake(amtToStake2);
    }

    /**
     *
     * @param amtToStake1 The amount staked by user1. This changes the alpha value at second interaction
     * @param amtToStake2 The amount staked by user2. This varies the final alphaNow
     * @notice Tests whether the contract offers the ability to view your alpha
     *  at last interaction. This contributes to the users' ability to calculate
     *  rewards off-chain
     */
    function test_CanViewAlphaAtLastInteraction(uint128 amtToStake1, uint128 amtToStake2) public {
        vm.assume(amtToStake1 > 0 && amtToStake2 > 0);
        address userAddr1 = vm.addr(0xB0b);
        address userAddr2 = vm.addr(0xAbe);
        _approveAndStake(userAddr1, amtToStake1, true);
        _waitForCoolDown();
        vm.prank(userAddr1);
        stakingContract.unstake(amtToStake1); // we do two interactions to avoid the default alpha value of 0
        uint256 alphaAfterUser1Interaction = stakingContract.alphaNow();

        _approveAndStake(userAddr2, amtToStake1, true); // alphaNow has increased now
        vm.prank(userAddr2);
        uint256 expectedAlphaAtLastUser1Interaction = stakingContract.viewAlphaAtMyLastInteraction();
        assertEq(
            expectedAlphaAtLastUser1Interaction,
            alphaAfterUser1Interaction,
            "Alpha at last user interaction is not as expected"
        );
    }

    /**
     * **********  PRIVATE FUNCTIONS **********
     */

    /**
     *
     * @param userAddr The address who wants to approve and stake with the staking contract
     * @param amtToApproveAndStake The amount to approve and stake
     * @param isDealRequired Whether we need to deal the account with prereq balance before initiating
     *  approval and staking
     * @dev This is used to simplify the verbose task of approving and staking with the
     *  required contract
     */
    function _approveAndStake(address userAddr, uint256 amtToApproveAndStake, bool isDealRequired) private {
        if (isDealRequired) {
            deal(address(stakingToken), userAddr, amtToApproveAndStake, true);
        }
        vm.startPrank(userAddr);
        stakingToken.approve(address(stakingContract), amtToApproveAndStake);
        stakingContract.stake(amtToApproveAndStake);
        vm.stopPrank();
    }

    /**
     *
     * @param arg0 The randomized arg0 for test_IndividualAndTotalStakedbalancesAreUpdated. This is
     *  unrefined data.
     * @dev This function refines the arg0 for test_IndividualAndTotalStakedbalancesAreUpdated.
     *  It makes sure:
     *  - no address is 0x0
     *  - that staked amount is at least 1
     *  - the unstaked amount is between 1 and the staked amount
     * @dev We need to refine it this way because foundry doesn't support refining for each element
     *  randomized input array
     */
    function _refineArg0_IndividualAndTotalStakedbalancesAreUpdated(
        Arg0_IndividualAndTotalStakedBalancesAreUpdated[] calldata arg0
    ) private pure returns (Arg0_IndividualAndTotalStakedBalancesAreUpdated[] memory) {
        Arg0_IndividualAndTotalStakedBalancesAreUpdated[] memory refinedArg0 =
            new Arg0_IndividualAndTotalStakedBalancesAreUpdated[](arg0.length);

        for (uint256 i = 0; i < arg0.length; i++) {
            Arg0_IndividualAndTotalStakedBalancesAreUpdated memory _randomInput = arg0[i];
            address userAddr = _randomInput.userAddr == address(0) ? address(1) : _randomInput.userAddr;
            uint128 amtToStake = _randomInput.amtToStake == 0 ? 1 : _randomInput.amtToStake;
            uint128 amtToUnstake = uint128(bound(_randomInput.amtToUnstake, 1, amtToStake));

            Arg0_IndividualAndTotalStakedBalancesAreUpdated memory newRandomInput =
            Arg0_IndividualAndTotalStakedBalancesAreUpdated({
                userAddr: userAddr,
                amtToStake: amtToStake,
                amtToUnstake: amtToUnstake
            });
            refinedArg0[i] = newRandomInput;
        }
        return refinedArg0;
    }

    /**
     * @dev This function warps the time until the ``stakingContract`` cools down and
     *  allows interactions again
     */
    function _waitForCoolDown() private {
        uint256 cooldownTime = (stakingContract.totalStakedAmt() / stakingContract.COOLDOWN_CONSTANT()) + 1;
        vm.warp(block.timestamp + cooldownTime);
    }

    /**
     * @dev This function calculates the expected new alpha if someone interacts
     *  now (block.timestamp).  This is a direct copy of the contract's logic. It
     *  is not meant to test the accuracy of the alpha calculation logic. Rather
     *  it is meant to check that the alpha updated or emitted is as expected.
     */
    function _getExpectedNewAlpha() private view returns (uint256) {
        return (
            stakingContract.alphaNow()
                + (block.timestamp - stakingContract.lastUpdatedRewardAt()) * stakingContract.COOLDOWN_CONSTANT()
                    / stakingContract.totalStakedAmt()
        );
    }

    /**
     * @param userAddr The address of the user whose expected rewards you wish to calculate
     * @dev This function calculates the expected new rewards awarded to the
     *  userAddr. This is a direct copy of the contract's logic. It is
     *  not meant to test the accuracy of the reward calculation logic. Rather it
     *  is meant to check that the rewards updated or emitted are as expected.
     */
    function _getExpectedNewUserReward(address userAddr) private returns (uint256) {
        uint256 alphaNow = _getExpectedNewAlpha();
        vm.prank(userAddr);
        uint256 alphaAtLastUserInteraction = stakingContract.viewAlphaAtMyLastInteraction();
        vm.prank(userAddr);
        uint256 userStakedAmt = stakingContract.viewMyStakedAmt();

        (bool isProd1Safe, uint256 prod1) = Math.tryMul(userStakedAmt, stakingContract.TOTAL_REWARDS_PER_SECOND());
        if (!isProd1Safe) {
            uint256 op1Result = Math.mulDiv(
                userStakedAmt, stakingContract.TOTAL_REWARDS_PER_SECOND(), stakingContract.COOLDOWN_CONSTANT()
            );
            return op1Result * (alphaNow - alphaAtLastUserInteraction);
        }
        return Math.mulDiv(prod1, (alphaNow - alphaAtLastUserInteraction), stakingContract.COOLDOWN_CONSTANT());
    }
}
