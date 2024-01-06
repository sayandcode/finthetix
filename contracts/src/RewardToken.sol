// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.21;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract FinthetixRewardToken is ERC20, Ownable {
    constructor() ERC20("FinthetixRewardToken", "FRT") Ownable(msg.sender) {}

    function mint(address to, uint256 amtToMint) external onlyOwner {
        _mint(to, amtToMint);
    }
}
