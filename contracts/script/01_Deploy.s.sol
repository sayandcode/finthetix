// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.23;

import {Script} from "forge-std/Script.sol";
import {FinthetixStakingToken} from "src/FinthetixStakingToken.sol";
import {FinthetixStakingContract} from "src/FinthetixStakingContract.sol";

contract DappDeployer is Script {
    function run() public returns (address stakingTokenAddr, address stakingContractAddr, address rewardTokenAddr) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        FinthetixStakingToken stakingToken = new FinthetixStakingToken();
        FinthetixStakingContract stakingContract = new FinthetixStakingContract(address(stakingToken));
        vm.stopBroadcast();
        stakingTokenAddr = address(stakingToken);
        stakingContractAddr = address(stakingContract);
        rewardTokenAddr = address(stakingContract.rewardToken());
    }
}
