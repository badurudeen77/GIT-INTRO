# DrugAuth - Pharmaceutical Supply Chain DApp

DrugAuth is a decentralized application (DApp) that provides secure tracking of pharmaceutical drug batches through every stage of the supply chain—from manufacturing to customer delivery—using Ethereum smart contracts and IPFS for document storage.

![DrugAuth Dashboard](https://via.placeholder.com/800x400?text=DrugAuth+Dashboard)

## Project Overview

DrugAuth addresses the critical need for transparency and authenticity in pharmaceutical supply chains. By leveraging blockchain technology and IPFS, the platform ensures:

- **Immutable Records**: Drug information is stored on Ethereum blockchain, making it tamper-proof
- **Complete Traceability**: Track every transfer from manufacturer to end customer
- **Document Security**: Certificates and documents stored securely on IPFS
- **Role-Based Access**: Different permissions for manufacturers, distributors, pharmacists, and customers
- **Real-time Verification**: Instant drug authenticity verification via QR codes

### Technologies Used

- **Frontend**: React (Vite), Tailwind CSS, Ethers.js
- **Smart Contracts**: Solidity, Hardhat, OpenZeppelin
- **Blockchain**: Ethereum Goerli Testnet
- **Storage**: IPFS via Web3.Storage
- **Wallet Integration**: MetaMask

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16.0.0 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MetaMask](https://metamask.io/) browser extension
- [Git](https://git-scm.com/)

### Required Accounts & API Keys

1. **MetaMask Wallet**: Install and set up MetaMask
2. **Infura Account**: Sign up at [infura.io](https://infura.io/) for Ethereum API access
3. **Web3.Storage Account**: Register at [web3.storage](https://web3.storage/) for IPFS storage
4. **Etherscan Account**: Register at [etherscan.io](https://etherscan.io/) for contract verification (optional)
5. **Goerli ETH**: Obtain test ETH from [Goerli Faucet](https://goerlifaucet.com/)

## Installation Guide

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/drugauth-dapp.git
cd drugauth-dapp
