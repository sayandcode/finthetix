// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.21;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FinthetixStakingToken is ERC20 {
    constructor() ERC20("FinthetixStakingToken", "FST") {}

    function requestSampleTokens() public {
        _mint(msg.sender, 5 ether);
    }
}
