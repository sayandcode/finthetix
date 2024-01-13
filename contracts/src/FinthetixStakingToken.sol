// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.23;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface FSTEvents {
    /**
     *
     * @param requesterAddr The address of the user requesting a sample of FST tokens
     * @dev This event is emitted when the user requests a sample of FST tokens
     */
    event SampleTokenRequested(address requesterAddr);
}

/**
 * @title FinthetixStakingToken
 * @author sayandcode
 * @notice This is the staking token used by the Finthetix Staking Contract. Users lock up this token
 *  to gain rewards in the token chosen by the staking contract.
 */
contract FinthetixStakingToken is ERC20, FSTEvents {
    constructor() ERC20("FinthetixStakingToken", "FST") {}

    /**
     * @notice Users can call this function to get a few sample tokens, in order to try out the
     *  staking contract
     */
    function requestSampleTokens() external {
        _mint(msg.sender, 5 ether);
        emit SampleTokenRequested(msg.sender);
    }
}
