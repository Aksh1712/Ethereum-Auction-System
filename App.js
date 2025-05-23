import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import Auction from './contracts/Auction.json';
import './App.css';

const App = () => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [highestBidder, setHighestBidder] = useState('');
  const [highestBid, setHighestBid] = useState('0');
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [bidAmount, setBidAmount] = useState('');

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3Instance.eth.getAccounts();
        const networkId = await web3Instance.eth.net.getId();
        const deployedNetwork = Auction.networks[networkId];
        const contractInstance = new web3Instance.eth.Contract(
          Auction.abi,
          deployedNetwork && deployedNetwork.address
        );
        const auctionStatus = await contractInstance.methods.getAuctionStatus().call();
        const timeRemaining = await contractInstance.methods.getTimeRemaining().call();

        setWeb3(web3Instance);
        setContract(contractInstance);
        setAccount(accounts[0]);
        setHighestBidder(auctionStatus[0]);
        setHighestBid(web3Instance.utils.fromWei(auctionStatus[1], 'ether'));
        setAuctionEnded(auctionStatus[2]);
        setTimeRemaining(Number(timeRemaining));
      }
    };
    init();
  }, []);

  const placeBid = async () => {
    if (!contract || !web3 || !bidAmount) return;
    try {
      await contract.methods.bid().send({
        from: account,
        value: web3.utils.toWei(bidAmount, 'ether')
      });
      const auctionStatus = await contract.methods.getAuctionStatus().call();
      setHighestBidder(auctionStatus[0]);
      setHighestBid(web3.utils.fromWei(auctionStatus[1], 'ether'));
      setBidAmount('');
    } catch (error) {
      console.error("Bid failed:", error);
    }
  };

  const withdraw = async () => {
    if (!contract || !web3) return;
    try {
      await contract.methods.withdraw().send({ from: account });
      alert("Withdrawal successful");
    } catch (error) {
      console.error("Withdrawal failed:", error);
    }
  };

  const endAuction = async () => {
    if (!contract || !web3) return;
    try {
      await contract.methods.endAuction().send({ from: account });
      const auctionStatus = await contract.methods.getAuctionStatus().call();
      setAuctionEnded(auctionStatus[2]);
    } catch (error) {
      console.error("End auction failed:", error);
    }
  };

  return (
    <div className="container">
      <h1>Ethereum Auction</h1>
      <p>Connected Account: {account}</p>
      <p>Highest Bidder: {highestBidder}</p>
      <p>Highest Bid: {highestBid} ETH</p>
      <p>Auction Status: {auctionEnded ? "Ended" : `Active (${Math.floor(timeRemaining / 60)} minutes remaining)`}</p>
      {!auctionEnded && (
        <div>
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder="Bid amount (ETH)"
          />
          <button onClick={placeBid}>Place Bid</button>
        </div>
      )}
      <button onClick={withdraw}>Withdraw Funds</button>
      {account.toLowerCase() === (contract && contract._address ? contract._address.toLowerCase() : '') && (
        <button onClick={endAuction} disabled={auctionEnded}>End Auction</button>
      )}
    </div>
  );
};

export default App;