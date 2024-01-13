// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.23;

import {FinthetixStakingContract, FSCErrors} from "src/FinthetixStakingContract.sol";
import {FinthetixStakingToken} from "src/FinthetixStakingToken.sol";
import {Test, console} from "forge-std/Test.sol";

contract FinthetixStakingContract_UnitTest is Test {
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
    function test_StakingTransfersTokensBetweenStakerAndStakingContract(uint248 amtToStake, address stakerAddr)
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
        _approveAndStake(stakerAddr, amtToStake);

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
        deal(address(stakingToken), stakerAddr, initTokenBalForStaker, true);
        _approveAndStake(stakerAddr, initTokenBalForStaker);

        // act & verify
        vm.prank(stakerAddr);
        vm.expectRevert(abi.encodeWithSelector(FSCErrors.CannotUnstakeZeroAmount.selector, stakerAddr));
        stakingContract.unstake(0);
    }

    /**
     * @param stakerAddr The address trying to unstake
     * @param _amtToStake The amount staked initially (unbounded)
     * @param _amtToUnstake The amount attempted to unstake (unbounded)
     * @notice Tests that error is thrown if trying to withdraw more than
     *  staked amount
     */
    function test_CannotUnStakeMoreThanStakedAmount(address stakerAddr, uint248 _amtToStake, uint248 _amtToUnstake)
        public
    {
        // assumptions
        vm.assume(stakerAddr != address(0));

        // setup
        uint256 boundedAmtToStake = bound(_amtToStake, 1, type(uint256).max - 1);
        uint256 boundedAmtToUnstake = bound(_amtToUnstake, boundedAmtToStake + 1, type(uint256).max); // unstake more than staked amt
        deal(address(stakingToken), stakerAddr, boundedAmtToStake, true);
        _approveAndStake(stakerAddr, boundedAmtToStake);

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
     * @param stakerAddr The address used to stake
     * @param arrOfAmts An array of numbers which are used to alternatively stake and unstake
     * @notice Tests whether the balances of the user are cumulatively updated when they stake/unstake. So we
     *  use a randomly generated array of numbers to stake/unstake iteratively, and then make sure balances
     *  are accurate.
     */
    function test_StakedBalancesOfStakerAreUpdated(address stakerAddr, uint248[] calldata arrOfAmts) public {
        // assumptions
        vm.assume(stakerAddr != address(0));

        // setup
        uint256 totalAmtStaked = 0;

        for (uint256 i = 0; i < arrOfAmts.length; i++) {
            // act
            uint248 thisAmt = arrOfAmts[i];
            if (thisAmt == 0) continue;
            if (thisAmt > totalAmtStaked) {
                // stake the amount
                deal(address(stakingToken), stakerAddr, thisAmt, true);
                _approveAndStake(stakerAddr, thisAmt);
                totalAmtStaked += thisAmt;
            } else {
                // unstake it
                vm.prank(stakerAddr);
                stakingContract.unstake(thisAmt);
                totalAmtStaked -= thisAmt;
            }

            // verify
            vm.prank(stakerAddr);
            uint256 newStakedBal = stakingContract.getCurrStakedBalance();
            assertEq(newStakedBal, totalAmtStaked, "Staked balance of staker is not updated");
        }
    }

    /**
     *
     * @param stakerAddr The address who wants to approve and stake with the staking contract
     * @param amtToApproveAndStake The amount to approve and stake
     * @dev This is used to simplify the verbose task of approving and staking with the
     *  required contract
     */
    function _approveAndStake(address stakerAddr, uint256 amtToApproveAndStake) private {
        vm.startPrank(stakerAddr);
        stakingToken.approve(address(stakingContract), amtToApproveAndStake);
        stakingContract.stake(amtToApproveAndStake);
        vm.stopPrank();
    }
}
