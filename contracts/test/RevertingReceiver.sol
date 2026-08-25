// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IEscrowActions {
    function submitWork(uint256 milestoneId, bytes32 deliverableHash) external;
}

contract RevertingReceiver {
    function submit(address escrow, uint256 milestoneId, bytes32 deliverableHash) external {
        IEscrowActions(escrow).submitWork(milestoneId, deliverableHash);
    }

    receive() external payable { revert("payment rejected"); }
}
