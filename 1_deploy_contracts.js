const Auction = artifacts.require("Auction");

module.exports = function (deployer) {
  deployer.deploy(Auction, process.env.BENEFICIARY_ADDRESS, 3600); // 1-hour auction
};