// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.23;

import {FinthetixStakingContract, FSCErrors} from "src/FinthetixStakingContract.sol";
import {FinthetixStakingToken} from "src/FinthetixStakingToken.sol";
import {Test, console} from "forge-std/Test.sol";

contract FinthetixStakingContract_UnitTest is Test {
    FinthetixStakingContract stakingContract;

    function setUp() public {
        stakingContract = new FinthetixStakingContract();
    }

    function test_HasStakingTokens() public {
        FinthetixStakingToken stakingToken = stakingContract.stakingToken();
        assertEq(stakingToken.balanceOf(address(this)), 0, "FST balance of test contract is not accurate");
    }

    function test_StakingBalForStakerIsUpdatedInStakingContract(uint256 amtToStake, address stakerAddr) public {
        // assumptions
        vm.assume(stakerAddr != address(0) && amtToStake != 0);

        // definitions
        address stakingTokenAddr = address(stakingContract.stakingToken());

        // setup
        uint256 expectedInitBal = 0;
        uint256 initStakedBalance = stakingContract.getCurrStakedBalance();
        assertEq(initStakedBalance, expectedInitBal, "Init Staked Balance of staker is not as expected");

        // act
        deal(stakingTokenAddr, stakerAddr, amtToStake, true);
        vm.startPrank(stakerAddr);
        stakingContract.stakingToken().approve(address(stakingContract), amtToStake);
        stakingContract.stake(amtToStake);
        vm.stopPrank();

        // verify
        vm.prank(stakerAddr);
        uint256 finalStakedBalance = stakingContract.getCurrStakedBalance();
        assertEq(finalStakedBalance, amtToStake, "Staking did not update staked balance of staker in staking contract");
    }

    function test_StakingTransfersTokensFromStakerToStakingContract(uint256 amtToStake, address stakerAddr) public {
        // assumptions
        vm.assume(stakerAddr != address(0) && amtToStake != 0);

        // definitions
        FinthetixStakingToken stakingToken = stakingContract.stakingToken();
        address stakingContractAddr = address(stakingContract);

        // setup
        deal(address(stakingToken), stakerAddr, amtToStake, true);
        uint256 initTokenBalOfStakingContract = stakingToken.balanceOf(stakingContractAddr);
        uint256 initTokenBalOfStaker = stakingToken.balanceOf(stakerAddr);

        // act
        vm.startPrank(stakerAddr);
        stakingToken.approve(stakingContractAddr, amtToStake);
        stakingContract.stake(amtToStake);
        vm.stopPrank();

        // verify
        uint256 finalTokenBalOfStakingContract = stakingToken.balanceOf(stakingContractAddr);
        uint256 finalTokenBalOfStaker = stakingToken.balanceOf(stakerAddr);
        uint256 expectedFinalTokenBalOfStakingContract = initTokenBalOfStakingContract + amtToStake;
        uint256 expectedFinalTokenBalOfStaker = initTokenBalOfStaker - amtToStake;
        assertEq(
            finalTokenBalOfStakingContract,
            expectedFinalTokenBalOfStakingContract,
            "Staking did not increase token balance of staking contract"
        );
        assertEq(
            finalTokenBalOfStaker, expectedFinalTokenBalOfStaker, "Staking did not decrease token balance of staker"
        );
    }

    function test_CanNotStakeInvalidAmt() public {
        // definitions
        FinthetixStakingToken stakingToken = stakingContract.stakingToken();

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

    function test_CanNotStakeFromInvalidAddr() public {
        // definitions
        FinthetixStakingToken stakingToken = stakingContract.stakingToken();

        // setup
        address stakerAddr = address(0);
        uint64 initTokenBalForStaker = 10 ether;
        deal(address(stakingToken), stakerAddr, initTokenBalForStaker, true);
        vm.startPrank(stakerAddr);

        // act & verify
        vm.expectRevert(FSCErrors.StakerAddressCannotBeZeroAddress.selector);
        stakingContract.stake(0);
        vm.stopPrank();
    }
}
