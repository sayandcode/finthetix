// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.23;

import {FinthetixStakingToken, FSTEvents} from "src/FinthetixStakingToken.sol";
import {Test} from "forge-std/Test.sol";

contract StakingToken_UnitTest is Test {
    string private constant TOKEN_NAME = "FinthetixStakingToken";
    string private constant TOKEN_SYMBOL = "FST";
    uint64 private constant SAMPLE_TOKEN_QTY = 5 ether;
    FinthetixStakingToken private tokenContract;

    function setUp() public {
        tokenContract = new FinthetixStakingToken();
    }

    /**
     * @notice Tests whether symbol and name are set correctly on ERC20
     */
    function test_HasCorrectLabels() public {
        assertEq(tokenContract.name(), TOKEN_NAME);
        assertEq(tokenContract.symbol(), TOKEN_SYMBOL);
    }

    /**
     * @notice Tests whether user has the ability to request sample tokens.
     *  This is used to try out the staking dapp.
     */
    function test_RequestSampleTokensFn() public {
        uint256 tokensBefore = tokenContract.balanceOf(address(this));
        assertEq(tokensBefore, 0);

        vm.expectEmit(address(tokenContract));
        emit FSTEvents.SampleTokenRequested(address(this));
        tokenContract.requestSampleTokens();

        uint256 tokensAfter = tokenContract.balanceOf(address(this));
        assertEq(tokensAfter, SAMPLE_TOKEN_QTY);
    }
}
