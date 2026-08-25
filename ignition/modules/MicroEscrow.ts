import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "ethers";

export default buildModule("MicroEscrowModule", (m) => {
  const freelancer = m.getParameter("freelancer");
  const arbitrator = m.getParameter("arbitrator");
  const milestoneAmounts = m.getParameter("milestoneAmounts", [parseEther("0.01")]);
  const escrow = m.contract("MicroEscrow", [freelancer, arbitrator, milestoneAmounts]);
  return { escrow };
});
