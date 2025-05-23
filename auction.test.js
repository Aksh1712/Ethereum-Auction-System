const Auction = artifacts.require("Auction");
const { expectRevert, time } = require("@openzeppelin/test-helpers");

contract("Auction", accounts => {
  let auction;
  const [owner, bidder1, bidder2, beneficiary] = accounts;
  const biddingTime = 3600;

  beforeEach(async () => {
    auction = await Auction.new(beneficiary, biddingTime, { from: owner });
  });

  it("should accept bids and update highest bidder", async () => {
    await auction.bid({ from: bidder1, value: web3.utils.toWei("1", "ether") });
    let status = await auction.getAuctionStatus();
    assert.equal(status[0], bidder1, "Bidder1 should be highest bidder");
    assert.equal(status[1].toString(), web3.utils.toWei("1", "ether"));

    await auction.bid({ from: bidder2, value: web3.utils.toWei("2", "ether") });
    status = await auction.getAuctionStatus();
    assert.equal(status[0], bidder2, "Bidder2 should be highest bidder");
    assert.equal(status[1].toString(), web3.utils.toWei("2", "ether"));
  });

  it("should allow outbid bidders to withdraw", async () => {
    await auction.bid({ from: bidder1, value: web3.utils.toWei("1", "ether") });
    await auction.bid({ from: bidder2, value: web3.utils.toWei("2", "ether") });
    const initialBalance = await web3.eth.getBalance(bidder1);
    await auction.withdraw({ from: bidder1 });
    const finalBalance = await web3.eth.getBalance(bidder1);
    assert(finalBalance > initialBalance, "Bidder1 should withdraw funds");
  });

  it("should end auction and transfer funds to beneficiary", async () => {
    await auction.bid({ from: bidder1, value: web3.utils.toWei("1", "ether") });
    await time.increase(biddingTime + 1);
    const initialBalance = await web3.eth.getBalance(beneficiary);
    await auction.endAuction({ from: owner });
    const finalBalance = await web3.eth.getBalance(beneficiary);
    assert(finalBalance > initialBalance, "Beneficiary should receive funds");
    const status = await auction.getAuctionStatus();
    assert.equal(status[2], true, "Auction should be ended");
  });

  it("should prevent bids after auction ends", async () => {
    await time.increase(biddingTime + 1);
    await auction.endAuction({ from: owner });
    await expectRevert(
      auction.bid({ from: bidder1, value: web3.utils.toWei("1", "ether") }),
      "Auction already ended"
    );
  });
});