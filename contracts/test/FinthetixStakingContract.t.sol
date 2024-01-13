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

    function test_HasStakingTokens() public {
        assertEq(stakingToken.balanceOf(address(this)), 0, "FST balance of test contract is not accurate");
    }

    function test_StakingTransfersTokensFromStakerToStakingContract(uint248 amtToStake, address stakerAddr) public {
        // assumptions
        vm.assume(stakerAddr != address(0) && amtToStake != 0);

        // definitions
        address stakingContractAddr = address(stakingContract);

        // setup
        deal(address(stakingToken), stakerAddr, amtToStake, true);
        uint256 initTokenBalOfStakingContract = stakingToken.balanceOf(stakingContractAddr);
        uint256 initTokenBalOfStaker = stakingToken.balanceOf(stakerAddr);

        // act
        _approveAndStake(stakerAddr, amtToStake);

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

    /**
     * The balances of the staking user must be cumulatively updated when they stake. So we use a randomly
     * generated array of numbers to stake iteratively, and then make sure balances are
     * accurate.
     * @param stakerAddr The address used to stake
     * @param arrOfAmtsToStake An array of numbers which are used to alternatively stake and unstake
     */
    function test_StakedBalancesOfStakerAreUpdated(address stakerAddr, uint248[] calldata arrOfAmtsToStake) public {
        // assumptions
        vm.assume(stakerAddr != address(0));

        // setup
        uint256 totalAmtStaked = 0;

        for (uint256 i = 0; i < arrOfAmtsToStake.length; i++) {
            // act
            uint248 amtToStake = arrOfAmtsToStake[i];
            if (amtToStake == 0) continue;
            deal(address(stakingToken), stakerAddr, amtToStake, true);
            _approveAndStake(stakerAddr, amtToStake);
            totalAmtStaked += amtToStake;

            // verify
            vm.prank(stakerAddr);
            uint256 newStakedBal = stakingContract.getCurrStakedBalance();
            assertEq(newStakedBal, totalAmtStaked, "Staked balance of staker is not updated");
        }
    }

    function _approveAndStake(address stakerAddr, uint248 amtToStake) private {
        vm.startPrank(stakerAddr);
        stakingToken.approve(address(stakingContract), amtToStake);
        stakingContract.stake(amtToStake);
        vm.stopPrank();
    }
}
