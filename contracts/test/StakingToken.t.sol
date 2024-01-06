// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.21;

import {FinthetixStakingToken} from "src/StakingToken.sol";
import {Test, console} from "forge-std/Test.sol";

contract StakingToken_UnitTest is Test {
    string constant TOKEN_NAME = "FinthetixStakingToken";
    string constant TOKEN_SYMBOL = "FST";
    uint256 constant SAMPLE_TOKEN_QTY = 5 ether;

    FinthetixStakingToken tokenContract;

    function setUp() public {
        tokenContract = new FinthetixStakingToken();
    }

    function test_HasCorrectLabels() public {
        assertEq(tokenContract.name(), TOKEN_NAME);
        assertEq(tokenContract.symbol(), TOKEN_SYMBOL);
    }

    function test_RequestSampleTokensFn() public {
        uint256 tokensBefore = tokenContract.balanceOf(address(this));
        assertEq(tokensBefore, 0);
        tokenContract.requestSampleTokens();
        uint256 tokensAfter = tokenContract.balanceOf(address(this));
        assertEq(tokensAfter, SAMPLE_TOKEN_QTY);
    }
}
