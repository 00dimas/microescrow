// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title MicroEscrow
/// @notice Testnet-oriented native-ETH escrow with milestone releases and arbitration.
contract MicroEscrow is ReentrancyGuard {
    enum Status { Pending, Submitted, Disputed, Released, Resolved }

    struct Milestone {
        uint256 amount;
        Status status;
        bytes32 deliverableHash;
    }

    error Unauthorized();
    error InvalidAddress();
    error InvalidMilestones();
    error InvalidAmount();
    error InvalidStatus();
    error AlreadyFunded();
    error NotFunded();
    error TransferFailed();
    error DirectPaymentDisabled();

    address public immutable client;
    address public immutable freelancer;
    address public immutable arbitrator;
    uint256 public immutable totalAmount;
    bool public funded;
    uint256 public releasedAmount;
    Milestone[] private milestones;

    event Funded(address indexed client, uint256 amount);
    event WorkSubmitted(uint256 indexed milestoneId, bytes32 indexed deliverableHash);
    event MilestoneReleased(uint256 indexed milestoneId, address indexed freelancer, uint256 amount);
    event DisputeRaised(uint256 indexed milestoneId, address indexed raisedBy);
    event DisputeResolved(uint256 indexed milestoneId, uint256 freelancerAward, uint256 clientRefund);

    modifier onlyClient() {
        if (msg.sender != client) revert Unauthorized();
        _;
    }

    modifier onlyFreelancer() {
        if (msg.sender != freelancer) revert Unauthorized();
        _;
    }

    modifier onlyParty() {
        if (msg.sender != client && msg.sender != freelancer) revert Unauthorized();
        _;
    }

    constructor(address freelancer_, address arbitrator_, uint256[] memory milestoneAmounts) {
        if (freelancer_ == address(0) || arbitrator_ == address(0)) revert InvalidAddress();
        if (freelancer_ == msg.sender || arbitrator_ == msg.sender || freelancer_ == arbitrator_) {
            revert InvalidAddress();
        }
        if (milestoneAmounts.length == 0 || milestoneAmounts.length > 100) revert InvalidMilestones();

        client = msg.sender;
        freelancer = freelancer_;
        arbitrator = arbitrator_;
        uint256 total;
        for (uint256 i; i < milestoneAmounts.length; ++i) {
            if (milestoneAmounts[i] == 0) revert InvalidAmount();
            total += milestoneAmounts[i];
            milestones.push(Milestone(milestoneAmounts[i], Status.Pending, bytes32(0)));
        }
        totalAmount = total;
    }

    function fund() external payable onlyClient {
        if (funded) revert AlreadyFunded();
        if (msg.value != totalAmount) revert InvalidAmount();
        funded = true;
        emit Funded(msg.sender, msg.value);
    }

    function submitWork(uint256 milestoneId, bytes32 deliverableHash) external onlyFreelancer {
        if (!funded) revert NotFunded();
        Milestone storage milestone = _milestone(milestoneId);
        if (milestone.status != Status.Pending || deliverableHash == bytes32(0)) revert InvalidStatus();
        milestone.status = Status.Submitted;
        milestone.deliverableHash = deliverableHash;
        emit WorkSubmitted(milestoneId, deliverableHash);
    }

    function approveMilestone(uint256 milestoneId) external onlyClient nonReentrant {
        if (!funded) revert NotFunded();
        Milestone storage milestone = _milestone(milestoneId);
        if (milestone.status != Status.Submitted) revert InvalidStatus();

        uint256 amount = milestone.amount;
        milestone.status = Status.Released;
        releasedAmount += amount;
        emit MilestoneReleased(milestoneId, freelancer, amount);
        _send(freelancer, amount);
    }

    function raiseDispute(uint256 milestoneId) external onlyParty {
        if (!funded) revert NotFunded();
        Milestone storage milestone = _milestone(milestoneId);
        if (milestone.status != Status.Pending && milestone.status != Status.Submitted) revert InvalidStatus();
        milestone.status = Status.Disputed;
        emit DisputeRaised(milestoneId, msg.sender);
    }

    function resolveDispute(uint256 milestoneId, uint256 freelancerAward) external nonReentrant {
        if (msg.sender != arbitrator) revert Unauthorized();
        Milestone storage milestone = _milestone(milestoneId);
        if (milestone.status != Status.Disputed || freelancerAward > milestone.amount) revert InvalidAmount();

        uint256 clientRefund = milestone.amount - freelancerAward;
        milestone.status = Status.Resolved;
        releasedAmount += freelancerAward;
        emit DisputeResolved(milestoneId, freelancerAward, clientRefund);
        if (freelancerAward != 0) _send(freelancer, freelancerAward);
        if (clientRefund != 0) _send(client, clientRefund);
    }

    function milestoneCount() external view returns (uint256) { return milestones.length; }

    function getMilestone(uint256 milestoneId) external view returns (Milestone memory) {
        return _milestone(milestoneId);
    }

    function remainingBalance() external view returns (uint256) { return address(this).balance; }

    function _milestone(uint256 milestoneId) private view returns (Milestone storage milestone) {
        if (milestoneId >= milestones.length) revert InvalidMilestones();
        milestone = milestones[milestoneId];
    }

    function _send(address recipient, uint256 amount) private {
        (bool success,) = payable(recipient).call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    receive() external payable { revert DirectPaymentDisabled(); }
    fallback() external payable { revert DirectPaymentDisabled(); }
}
