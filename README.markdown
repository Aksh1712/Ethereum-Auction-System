# Ethereum Auction System

A smart contract for a simple Ethereum-based auction where users can place bids, and the highest bidder wins.

## Features
- Place bids in Ether.
- Tracks highest bidder and bid amount.
- Auctioneer can end the auction, transferring funds to the beneficiary.
- Outbid bidders can withdraw funds.
- View auction status and time remaining.

## Prerequisites
- Node.js v16+
- Truffle v5.5.0+
- Ganache CLI (for local testing)
- MetaMask (for testnet interaction)
- Infura account (for testnet deployment)

## Installation
1. Clone the repository: `git clone https://github.com/Aksh1712/auction-system`
2. Install dependencies: `npm install`
3. Start Ganache: `ganache-cli`
4. Compile and deploy: `truffle compile && truffle migrate`

## Deployment
- Deploy to Sepolia testnet: `truffle migrate --network sepolia`
- Verify contract: `truffle run verify Auction --network sepolia`

## Usage
- Connect MetaMask to Sepolia or Ganache.
- Interact via Remix or the front-end (`app/`).
- Place bids using the `bid` function.
- Withdraw outbid funds using `withdraw`.
- End the auction (owner only) using `endAuction`.
- View status with `getAuctionStatus` and `getTimeRemaining`.

## Front-End
1. Navigate to `app/`: `cd app`
2. Install dependencies: `npm install`
3. Start the app: `npm start`
4. Connect MetaMask and interact with the contract.

## Preview
- [Auction contract screenshot](preview/auction_screenshot.png)
- [Auction demo video](preview/auction_demo.gif)

## Download
- [Project Zip](https://github.com/Aksh1712/auction-system/releases)