// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.21;

import {FinthetixStakingToken} from "src/FinthetixStakingToken.sol";
import {Test} from "forge-std/Test.sol";

contract StakingToken_UnitTest is Test {
    string private constant TOKEN_NAME = "FinthetixStakingToken";
    string private constant TOKEN_SYMBOL = "FST";
    uint256 private constant SAMPLE_TOKEN_QTY = 5 ether;

    FinthetixStakingToken private tokenContract;

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
