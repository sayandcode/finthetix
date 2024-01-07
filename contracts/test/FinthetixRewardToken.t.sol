// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.23;

import {FinthetixRewardToken} from "src/FinthetixRewardToken.sol";
import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract RewardToken_UnitTest is Test {
    string private constant TOKEN_SYMBOL = "FRT";
    string private constant TOKEN_NAME = "FinthetixRewardToken";
    address private immutable contractOwnerAddr = vm.addr(0xB0b);

    FinthetixRewardToken private tokenContract;

    function setUp() public {
        vm.prank(contractOwnerAddr);
        tokenContract = new FinthetixRewardToken();
    }

    function test_HasCorrectLabels() public {
        assertEq(tokenContract.symbol(), TOKEN_SYMBOL, "Incorrect Token Symbol");
        assertEq(tokenContract.name(), TOKEN_NAME, "Incorrect Token Name");
    }

    function test_CanMintToken(uint256 amtToMint) public {
        address receiverAddr = address(1);

        uint256 balanceBefore = tokenContract.balanceOf(receiverAddr);
        assertEq(balanceBefore, 0);

        vm.prank(contractOwnerAddr);
        tokenContract.mint(receiverAddr, amtToMint);

        uint256 balanceAfter = tokenContract.balanceOf(receiverAddr);
        assertEq(balanceAfter, amtToMint);
    }

    function test_NonOwnersCannotMint(address senderAddr) public {
        vm.assume(senderAddr != contractOwnerAddr);

        uint8 amtToMint = 2;

        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, senderAddr));
        vm.prank(senderAddr);
        tokenContract.mint(senderAddr, amtToMint);
    }
}
