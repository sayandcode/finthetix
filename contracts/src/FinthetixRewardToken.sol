// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.21;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FinthetixRewardtoken
 * @author sayandcode
 * @notice This token is paid out by the Finthetix Staking Contract as a reward
 * @dev This contract needs to be deployed by the Staking Contract in order for it to be able to
 *  generate rewards periodically. This is because only the owner of this Token Contract can mint
 *  more tokens
 */
contract FinthetixRewardToken is ERC20, Ownable {
    constructor() ERC20("FinthetixRewardToken", "FRT") Ownable(msg.sender) {}

    /**
     *
     * @param to The address of the recipient of the funds
     * @param amtToMint The amount of tokens to allocate to the recipient
     * @notice This function will be called by the staking contract when it is time to generate rewards for stakers
     * @dev This is intended to be only used by the Staking Contract
     */
    function mint(address to, uint256 amtToMint) external onlyOwner {
        _mint(to, amtToMint);
    }
}
