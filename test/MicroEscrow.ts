import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("MicroEscrow", function () {
  async function fixture() {
    const [client, freelancer, arbitrator, outsider] = await ethers.getSigners();
    const amounts = [ethers.parseEther("1"), ethers.parseEther("2")];
    const escrow = await ethers.deployContract("MicroEscrow", [freelancer.address, arbitrator.address, amounts]);
    return { escrow, client, freelancer, arbitrator, outsider, amounts, total: amounts[0] + amounts[1] };
  }

  async function fundedFixture() {
    const state = await loadFixture(fixture);
    await state.escrow.fund({ value: state.total });
    return state;
  }

  describe("deployment and funding", function () {
    it("stores immutable parties and milestones", async function () {
      const { escrow, client, freelancer, arbitrator, total } = await loadFixture(fixture);
      expect(await escrow.client()).to.equal(client.address);
      expect(await escrow.freelancer()).to.equal(freelancer.address);
      expect(await escrow.arbitrator()).to.equal(arbitrator.address);
      expect(await escrow.totalAmount()).to.equal(total);
      expect(await escrow.milestoneCount()).to.equal(2);
    });

    it("rejects invalid parties and milestone definitions", async function () {
      const [client, freelancer, arbitrator] = await ethers.getSigners();
      const Factory = await ethers.getContractFactory("MicroEscrow");
      await expect(Factory.deploy(ethers.ZeroAddress, arbitrator.address, [1])).to.be.revertedWithCustomError(Factory, "InvalidAddress");
      await expect(Factory.deploy(freelancer.address, freelancer.address, [1])).to.be.revertedWithCustomError(Factory, "InvalidAddress");
      await expect(Factory.deploy(freelancer.address, arbitrator.address, [])).to.be.revertedWithCustomError(Factory, "InvalidMilestones");
      await expect(Factory.deploy(freelancer.address, arbitrator.address, [0])).to.be.revertedWithCustomError(Factory, "InvalidAmount");
      await expect(Factory.deploy(client.address, arbitrator.address, [1])).to.be.revertedWithCustomError(Factory, "InvalidAddress");
    });

    it("accepts one exact client deposit and rejects every other funding path", async function () {
      const { escrow, client, outsider, total } = await loadFixture(fixture);
      await expect(escrow.connect(outsider).fund({ value: total })).to.be.revertedWithCustomError(escrow, "Unauthorized");
      await expect(escrow.fund({ value: total - 1n })).to.be.revertedWithCustomError(escrow, "InvalidAmount");
      await expect(escrow.fund({ value: total })).to.emit(escrow, "Funded").withArgs(client.address, total);
      expect(await ethers.provider.getBalance(escrow)).to.equal(total);
      await expect(escrow.fund({ value: total })).to.be.revertedWithCustomError(escrow, "AlreadyFunded");
      await expect(client.sendTransaction({ to: escrow, value: 1 })).to.be.revertedWithCustomError(escrow, "DirectPaymentDisabled");
      await expect(client.sendTransaction({ to: escrow, data: "0x12345678" })).to.be.revertedWithCustomError(escrow, "DirectPaymentDisabled");
    });
  });

  describe("milestone release", function () {
    it("requires funding, freelancer submission, and client approval", async function () {
      const { escrow, client, freelancer, outsider, amounts } = await loadFixture(fixture);
      const hash = ethers.id("ipfs://deliverable");
      await expect(escrow.connect(freelancer).submitWork(0, hash)).to.be.revertedWithCustomError(escrow, "NotFunded");
      await escrow.fund({ value: amounts[0] + amounts[1] });
      await expect(escrow.connect(outsider).submitWork(0, hash)).to.be.revertedWithCustomError(escrow, "Unauthorized");
      await expect(escrow.connect(freelancer).submitWork(0, ethers.ZeroHash)).to.be.revertedWithCustomError(escrow, "InvalidStatus");
      await expect(escrow.connect(freelancer).submitWork(0, hash)).to.emit(escrow, "WorkSubmitted").withArgs(0, hash);
      await expect(escrow.connect(outsider).approveMilestone(0)).to.be.revertedWithCustomError(escrow, "Unauthorized");
      await expect(() => escrow.connect(client).approveMilestone(0)).to.changeEtherBalances([escrow, freelancer], [-amounts[0], amounts[0]]);
      expect((await escrow.getMilestone(0)).status).to.equal(3);
      expect(await escrow.releasedAmount()).to.equal(amounts[0]);
      await expect(escrow.connect(client).approveMilestone(0)).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });

    it("rejects invalid milestone ids and invalid transitions", async function () {
      const { escrow, client, freelancer } = await loadFixture(fundedFixture);
      await expect(escrow.getMilestone(2)).to.be.revertedWithCustomError(escrow, "InvalidMilestones");
      await expect(escrow.connect(client).approveMilestone(0)).to.be.revertedWithCustomError(escrow, "InvalidStatus");
      await escrow.connect(freelancer).submitWork(0, ethers.id("done"));
      await expect(escrow.connect(freelancer).submitWork(0, ethers.id("again"))).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });

    it("reverts state atomically when the recipient rejects ETH", async function () {
      const [client, , arbitrator] = await ethers.getSigners();
      const receiver = await ethers.deployContract("RevertingReceiver");
      const amount = ethers.parseEther("1");
      const escrow = await ethers.deployContract("MicroEscrow", [receiver, arbitrator.address, [amount]]);
      await escrow.connect(client).fund({ value: amount });
      await receiver.submit(escrow, 0, ethers.id("work"));
      await expect(escrow.connect(client).approveMilestone(0)).to.be.revertedWithCustomError(escrow, "TransferFailed");
      expect((await escrow.getMilestone(0)).status).to.equal(1);
      expect(await escrow.releasedAmount()).to.equal(0);
      expect(await escrow.remainingBalance()).to.equal(amount);
    });
  });

  describe("disputes", function () {
    it("lets either party dispute pending or submitted work", async function () {
      const { escrow, client, freelancer, outsider } = await loadFixture(fundedFixture);
      await expect(escrow.connect(outsider).raiseDispute(0)).to.be.revertedWithCustomError(escrow, "Unauthorized");
      await expect(escrow.connect(client).raiseDispute(0)).to.emit(escrow, "DisputeRaised").withArgs(0, client.address);
      await escrow.connect(freelancer).submitWork(1, ethers.id("work"));
      await expect(escrow.connect(freelancer).raiseDispute(1)).to.emit(escrow, "DisputeRaised").withArgs(1, freelancer.address);
      await expect(escrow.connect(client).raiseDispute(0)).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });

    it("allows only arbitrator to split the exact milestone value", async function () {
      const { escrow, client, freelancer, arbitrator, outsider, amounts } = await loadFixture(fundedFixture);
      await escrow.connect(client).raiseDispute(0);
      const award = ethers.parseEther("0.4");
      await expect(escrow.connect(outsider).resolveDispute(0, award)).to.be.revertedWithCustomError(escrow, "Unauthorized");
      await expect(escrow.connect(arbitrator).resolveDispute(0, amounts[0] + 1n)).to.be.revertedWithCustomError(escrow, "InvalidAmount");
      await expect(() => escrow.connect(arbitrator).resolveDispute(0, award)).to.changeEtherBalances(
        [escrow, freelancer, client], [-amounts[0], award, amounts[0] - award]
      );
      expect((await escrow.getMilestone(0)).status).to.equal(4);
      expect(await escrow.releasedAmount()).to.equal(award);
      await expect(escrow.connect(arbitrator).resolveDispute(0, 0)).to.be.revertedWithCustomError(escrow, "InvalidAmount");
    });

    it("supports full refund and full freelancer award", async function () {
      const { escrow, client, arbitrator, amounts } = await loadFixture(fundedFixture);
      await escrow.connect(client).raiseDispute(0);
      await escrow.connect(arbitrator).resolveDispute(0, 0);
      await escrow.connect(client).raiseDispute(1);
      await escrow.connect(arbitrator).resolveDispute(1, amounts[1]);
      expect(await escrow.remainingBalance()).to.equal(0);
    });
  });
});
