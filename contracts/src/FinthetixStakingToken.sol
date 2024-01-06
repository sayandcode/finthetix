// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.21;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title FinthetixStakingToken
 * @author sayandcode
 * @notice This is the staking token used by the Finthetix Staking Contract. Users lock up this token
 *  to gain rewards in the token chosen by the staking contract.
 */
contract FinthetixStakingToken is ERC20 {
    constructor() ERC20("FinthetixStakingToken", "FST") {}

    /**
     * @notice Users can call this function to get a few sample tokens, in order to try out the
     *  staking contract
     */
    function requestSampleTokens() public {
        _mint(msg.sender, 5 ether);
    }
}
