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

    /**
     * @notice Tests whether symbol and name are set correctly on ERC20
     */
    function test_HasCorrectLabels() public {
        assertEq(tokenContract.symbol(), TOKEN_SYMBOL, "Incorrect Token Symbol");
        assertEq(tokenContract.name(), TOKEN_NAME, "Incorrect Token Name");
    }

    /**
     * @param amtToMint The amount of token to mint
     * @notice Tests whether minting of token is possible, and updates user balance correctly
     */
    function test_CanMintToken(uint256 amtToMint) public {
        address receiverAddr = address(1);

        uint256 balanceBefore = tokenContract.balanceOf(receiverAddr);
        assertEq(balanceBefore, 0);

        vm.prank(contractOwnerAddr);
        tokenContract.mint(receiverAddr, amtToMint);

        uint256 balanceAfter = tokenContract.balanceOf(receiverAddr);
        assertEq(balanceAfter, amtToMint);
    }

    /**
     * @param senderAddr The address who sends the request to mint tokens
     * @notice Tests whether non owners of the ERC20 are blocked from minting tokens
     */
    function test_NonOwnersCannotMint(address senderAddr) public {
        vm.assume(senderAddr != contractOwnerAddr);

        uint8 amtToMint = 2;

        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, senderAddr));
        vm.prank(senderAddr);
        tokenContract.mint(senderAddr, amtToMint);
    }
}
