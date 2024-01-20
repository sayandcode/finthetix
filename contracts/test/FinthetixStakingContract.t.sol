// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.23;

import {FinthetixStakingContract, FSCErrors} from "src/FinthetixStakingContract.sol";
import {FinthetixStakingToken} from "src/FinthetixStakingToken.sol";
import {Test, console} from "forge-std/Test.sol";

contract FinthetixStakingContract_UnitTest is Test {
    /**
     * @dev The random input used for test_IndividualAndTotalStakedBalancesAreUpdated
     */
    struct Arg0_IndividualAndTotalStakedBalancesAreUpdated {
        address stakerAddr;
        uint128 amtToStake;
        uint128 amtToUnstake;
    }

    /**
     * @notice This is 10x larger than the TOTAL_REWARDS_PER_SECOND variable.
     *  The obtained rewards will never be bigger than the rewards owed.
     *  i.e. The precision loss is downwards
     */
    uint256 REWARD_PRECISION = 1e18;
    FinthetixStakingContract stakingContract;
    FinthetixStakingToken stakingToken;

    function setUp() public {
        stakingContract = new FinthetixStakingContract();
        stakingToken = stakingContract.stakingToken();
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
     * @param stakerAddr The address of the staker
     * @notice Tests whether the token balances are updated on the ERC20
     *  side whenever there is a staking/unstaking action
     */
    function test_StakingTransfersTokensBetweenStakerAndStakingContract(uint128 amtToStake, address stakerAddr)
        public
    {
        // assumptions
        vm.assume(stakerAddr != address(0) && amtToStake != 0);

        // definitions
        address stakingContractAddr = address(stakingContract);

        // setup
        deal(address(stakingToken), stakerAddr, amtToStake, true);
        uint256 tokenBal1OfStakingContract = stakingToken.balanceOf(stakingContractAddr);
        uint256 tokenBal1OfStaker = stakingToken.balanceOf(stakerAddr);

        // act 1 - stake
        _approveAndStake(stakerAddr, amtToStake, false);

        // verify 1
        uint256 tokenBal2OfStakingContract = stakingToken.balanceOf(stakingContractAddr);
        uint256 tokenBal2OfStaker = stakingToken.balanceOf(stakerAddr);
        uint256 expectedTokenBal2OfStakingContract = tokenBal1OfStakingContract + amtToStake;
        uint256 expectedTokenBal2OfStaker = tokenBal1OfStaker - amtToStake;
        assertEq(
            tokenBal2OfStakingContract,
            expectedTokenBal2OfStakingContract,
            "Staking did not increase token balance of staking contract"
        );
        assertEq(tokenBal2OfStaker, expectedTokenBal2OfStaker, "Staking did not decrease token balance of staker");

        // setup 2
        _waitForCoolDown();

        // act 2 - unstake
        vm.prank(stakerAddr);
        stakingContract.unstake(amtToStake);

        // verify 2
        uint256 tokenBal3OfStakingContract = stakingToken.balanceOf(stakingContractAddr);
        uint256 tokenBal3OfStaker = stakingToken.balanceOf(stakerAddr);
        assertEq(
            tokenBal3OfStakingContract,
            tokenBal1OfStakingContract,
            "Unstaking did not decrease token balance of staking contract"
        );
        assertEq(tokenBal3OfStaker, tokenBal1OfStaker, "Unstaking did not increase token balance of staker");
    }

    /**
     * @notice Tests that users cannot stake 0 amount
     */
    function test_CanNotStakeInvalidAmt() public {
        // setup
        address stakerAddr = vm.addr(0xB0b);
        uint64 initTokenBalForStaker = 10 ether;
        deal(address(stakingToken), stakerAddr, initTokenBalForStaker, true);
        vm.startPrank(stakerAddr);
        stakingToken.approve(address(stakingContract), initTokenBalForStaker);

        // act & verify
        vm.expectRevert(abi.encodeWithSelector(FSCErrors.CannotStakeZeroAmount.selector, stakerAddr));
        stakingContract.stake(0);
        vm.stopPrank();
    }

    /**
     * @notice Tests that users cannot stake 0 amount
     */
    function test_CanNotUnstakeInvalidAmt() public {
        // setup
        address stakerAddr = vm.addr(0xB0b);
        uint64 initTokenBalForStaker = 10 ether;
        _approveAndStake(stakerAddr, initTokenBalForStaker, true);

        // act & verify
        vm.prank(stakerAddr);
        vm.expectRevert(abi.encodeWithSelector(FSCErrors.CannotUnstakeZeroAmount.selector, stakerAddr));
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
        address stakerAddr = vm.addr(0xB0b);
        _approveAndStake(stakerAddr, boundedAmtToStake, true);

        // act & verify
        vm.prank(stakerAddr);
        vm.expectRevert(
            abi.encodeWithSelector(
                FSCErrors.CannotUnstakeMoreThanStakedAmount.selector, stakerAddr, boundedAmtToUnstake, boundedAmtToStake
            )
        );
        stakingContract.unstake(boundedAmtToUnstake);
    }

    /**
     * @notice Tests that zero address cannot stake
     */
    function test_CanNotStakeFromInvalidAddr() public {
        // setup
        address stakerAddr = address(0);
        uint64 initTokenBalForStaker = 10 ether;
        deal(address(stakingToken), stakerAddr, initTokenBalForStaker, true);
        vm.startPrank(stakerAddr);

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
     * @param arg0 An array of inputs containing staker address, amount to stake and amount to unstake.
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
            address stakerAddr = refinedArg0[i].stakerAddr;
            uint256 amtToStake = refinedArg0[i].amtToStake;
            uint256 amtToUnstake = refinedArg0[i].amtToUnstake;
            vm.prank(stakerAddr);
            uint256 preStakeBal = stakingContract.viewMyStakedAmt();

            // act 1 - stake
            _approveAndStake(stakerAddr, amtToStake, true);

            // verify 1 - stake
            expectedTotalStakedBal += amtToStake;
            assertEq(stakingContract.totalStakedAmt(), expectedTotalStakedBal, "Total amt staked has not increased");
            vm.prank(stakerAddr);
            uint256 postStakeBal = stakingContract.viewMyStakedAmt();
            uint256 expectedPostStakeBal = preStakeBal + amtToStake;
            assertEq(postStakeBal, expectedPostStakeBal, "The post-staking balance for staker is accurate");

            // cleanup 1 - stake
            _waitForCoolDown();

            // act 2 - unstake
            vm.prank(stakerAddr);
            stakingContract.unstake(amtToUnstake);

            // verify 2 - unstake
            expectedTotalStakedBal -= amtToUnstake;
            assertEq(stakingContract.totalStakedAmt(), expectedTotalStakedBal, "Total amt staked has not decreased");
            vm.prank(stakerAddr);
            uint256 postUnstakeBal = stakingContract.viewMyStakedAmt();
            uint256 expectedStakerBal = expectedPostStakeBal - amtToUnstake;
            assertEq(postUnstakeBal, expectedStakerBal, "The post-unstaking balance for staker is accurate");

            // cleanup 2 - unstake
            _waitForCoolDown();
        }
    }

    /**
     *
     * @param stakerAddr The address whose reward balance you wish to check
     * @notice Tests whether addresses start off with zero rewards
     */
    function test_InitialRewardsIsZero(address stakerAddr) public {
        // assumptions
        vm.assume(stakerAddr != address(0));

        // act
        vm.prank(stakerAddr);
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
        uint256 expectedRewardsForUser1;

        // setup
        /// user 1 stakes
        uint256 lastInteractedTime = block.timestamp;
        address stakerAddr1 = vm.addr(0xB0b);
        address stakerAddr2 = vm.addr(0xAbe);
        _approveAndStake(stakerAddr1, amtToStake1, true);
        _waitForCoolDown();

        /// user 2 stakes
        _approveAndStake(stakerAddr2, amtToStake2, true);
        expectedRewardsForUser1 += stakingContract.TOTAL_REWARDS_PER_SECOND() * (block.timestamp - lastInteractedTime);
        lastInteractedTime = block.timestamp;
        _waitForCoolDown();

        /// user 1 unstakes
        vm.prank(stakerAddr1);
        stakingContract.unstake(amtToStake1);
        uint256 totalStakedAmt = amtToStake1 + amtToStake2;
        expectedRewardsForUser1 += (
            amtToStake1 * stakingContract.TOTAL_REWARDS_PER_SECOND() * (block.timestamp - lastInteractedTime)
        ) / (totalStakedAmt);
        lastInteractedTime = block.timestamp;

        // act & verify
        vm.prank(stakerAddr1);
        uint256 accruedRewards = stakingContract.viewMyPublishedRewards();

        assert(expectedRewardsForUser1 - accruedRewards < 1e18);
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
        address stakerAddr = vm.addr(0xB0b);
        uint256 amtToStake = 10 ether;
        uint256 newTime = block.timestamp + timeToWait;
        vm.warp(newTime);

        // act
        _approveAndStake(stakerAddr, amtToStake, true);

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
        address stakerAddr = vm.addr(0xB0b);
        _approveAndStake(stakerAddr, amtToStake, true);
        uint256 newTime = block.timestamp + timeToWait;
        vm.warp(newTime);

        // act
        vm.prank(stakerAddr);
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
        address stakerAddr = vm.addr(0xB0b);
        uint256 amtToApprove = type(uint256).max;
        deal(address(stakingToken), stakerAddr, amtToApprove, true);
        vm.prank(stakerAddr);
        stakingToken.approve(address(stakingContract), amtToApprove);
        vm.prank(stakerAddr);
        stakingContract.stake(initAmtToStake);
        uint256 initTime = block.timestamp;
        uint256 newTime = initTime + timeToWait;
        vm.warp(newTime);

        // act & verify
        vm.prank(stakerAddr);
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
        address stakerAddr = vm.addr(0xB0b);
        _approveAndStake(stakerAddr, initAmtToStake, true);
        uint256 initTime = block.timestamp;
        uint256 newTime = initTime + timeToWait;
        vm.warp(newTime);
        uint256 amtToUnstake = 1;

        // act & verify
        vm.expectRevert(abi.encodeWithSelector(FSCErrors.CannotInteractWhenCoolingDown.selector, newTime, initTime));
        vm.prank(stakerAddr);
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
        address stakerAddr1 = vm.addr(0xB0b);
        _approveAndStake(stakerAddr1, initAmtToStake, true);
        uint256 initAlphaNow = stakingContract.alphaNow();
        vm.warp(block.timestamp + timeToWait);

        // act
        uint256 secondAmtToStake = 1;
        _approveAndStake(stakerAddr1, secondAmtToStake, true);

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
        address stakerAddr1 = vm.addr(0xB0b);
        _approveAndStake(stakerAddr1, initAmtToStake, true);
        uint256 initAlphaNow = stakingContract.alphaNow();
        vm.warp(block.timestamp + timeToWait);

        // act
        vm.prank(stakerAddr1);
        stakingContract.unstake(1);

        // verify
        uint256 expectedAlphaNow = initAlphaNow + (stakingContract.COOLDOWN_CONSTANT() * timeToWait) / initAmtToStake; // the reward is updated without including balance from new stake info
        assertEq(stakingContract.alphaNow(), expectedAlphaNow, "Staking doesn't update alphaNow");
    }

    /**
     * **********  PRIVATE FUNCTIONS **********
     */

    /**
     *
     * @param stakerAddr The address who wants to approve and stake with the staking contract
     * @param amtToApproveAndStake The amount to approve and stake
     * @param isDealRequired Whether we need to deal the account with prereq balance before initiating
     *  approval and staking
     * @dev This is used to simplify the verbose task of approving and staking with the
     *  required contract
     */
    function _approveAndStake(address stakerAddr, uint256 amtToApproveAndStake, bool isDealRequired) private {
        if (isDealRequired) {
            deal(address(stakingToken), stakerAddr, amtToApproveAndStake, true);
        }
        vm.startPrank(stakerAddr);
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
            address stakerAddr = _randomInput.stakerAddr == address(0) ? address(1) : _randomInput.stakerAddr;
            uint128 amtToStake = _randomInput.amtToStake == 0 ? 1 : _randomInput.amtToStake;
            uint128 amtToUnstake = uint128(bound(_randomInput.amtToUnstake, 1, amtToStake));

            Arg0_IndividualAndTotalStakedBalancesAreUpdated memory newRandomInput =
            Arg0_IndividualAndTotalStakedBalancesAreUpdated({
                stakerAddr: stakerAddr,
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
}
