# DrugAuth - Pharmaceutical Supply Chain DApp

## Overview

DrugAuth is a decentralized application (DApp) that provides secure tracking of pharmaceutical drug batches through every stage of the supply chain—from manufacturing to customer delivery. The system leverages Ethereum blockchain technology for immutable record keeping and IPFS for secure document storage, ensuring complete traceability and authenticity verification of pharmaceutical products.

## Features

- **Blockchain-based Drug Registration**: Register drug batches on Ethereum with immutable records
- **Supply Chain Tracking**: Track drug ownership transfers through the entire supply chain
- **QR Code Verification**: Generate and scan QR codes for instant drug authenticity verification
- **Role-based Access Control**: Different permissions for manufacturers, distributors, pharmacists, and customers
- **IPFS Document Storage**: Secure storage of certificates and documentation
- **Real-time Dashboard**: Monitor drug batches, supply chain events, and analytics

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** for styling
- **shadcn/ui** for component library
- **TanStack Query** for state management
- **Wouter** for routing
- **React Hook Form** with Zod validation

### Blockchain
- **Solidity** smart contracts
- **Hardhat** development environment
- **Ethers.js** for blockchain interaction
- **MetaMask** wallet integration
- **Ethereum Goerli Testnet** for deployment

### Backend
- **Node.js** with Express
- **PostgreSQL** with Drizzle ORM
- **IPFS** for decentralized storage
- **TypeScript** throughout

## Quick Start

### Prerequisites

1. **Node.js 18+** installed
2. **MetaMask** browser extension
3. **Goerli ETH** for testnet transactions (get from [Goerli Faucet](https://goerlifaucet.com))

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone [repository-url]
   cd drugauth
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   # Database (optional for development - uses in-memory storage)
   DATABASE_URL=postgresql://user:password@localhost:5432/drugauth
   
   # Blockchain (optional - uses mock data in development)
   VITE_INFURA_PROJECT_ID=your_infura_project_id
   VITE_CONTRACT_ADDRESS=deployed_contract_address
   
   # IPFS Storage (optional - uses mock storage in development)
   VITE_PINATA_API_KEY=your_pinata_api_key
   VITE_PINATA_SECRET_KEY=your_pinata_secret_key
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Open your browser to `http://localhost:5000`
   - Connect your MetaMask wallet
   - Switch to Goerli testnet if needed

## Smart Contract Deployment

### Local Development

1. **Start local Hardhat network**:
   ```bash
   npx hardhat node
   ```

2. **Deploy contracts locally**:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

### Goerli Testnet Deployment

1. **Configure Hardhat for Goerli**:
   Add your private key and Infura URL to `hardhat.config.js`

2. **Deploy to Goerli**:
   ```bash
   npx hardhat run scripts/deploy.js --network goerli
   ```

3. **Verify contract on Etherscan**:
   ```bash
   npx hardhat verify --network goerli DEPLOYED_CONTRACT_ADDRESS
   ```

## Usage Guide

### 1. Connect Wallet
- Install MetaMask browser extension
- Create or import a wallet
- Switch to Goerli testnet
- Get test ETH from faucet
- Connect wallet in the application

### 2. Register as User
- Choose your role: Manufacturer, Producer, Distributor, Pharmacist, or Customer
- Each role has specific permissions in the supply chain

### 3. Register Drug Batch (Manufacturers)
- Navigate to "Register Drug" page
- Fill in drug details:
  - Drug name and batch ID
  - Manufacturing and expiry dates
  - Upload certificates to IPFS
- Submit to create blockchain record

### 4. Transfer Ownership (Supply Chain Participants)
- Go to "Track Supply Chain" page
- Search for drug batch by ID
- Initiate ownership transfer
- Specify new owner and transfer type
- Confirm blockchain transaction

### 5. Verify Drug Authenticity (Anyone)
- Navigate to "Verify Drug" page
- Enter batch ID or scan QR code
- View complete drug history and authenticity
- Check supply chain timeline

### 6. Generate QR Codes
- From dashboard or drug details
- QR codes contain batch verification URL
- Can be printed on packaging for easy verification

## Project Structure

```
drugauth/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/           # React hooks (blockchain, IPFS)
│   │   ├── pages/           # Application pages
│   │   ├── utils/           # Utility functions
│   │   └── lib/             # Shared libraries
├── contracts/                # Solidity smart contracts
├── server/                   # Backend Express server
├── shared/                   # Shared TypeScript schemas
├── scripts/                  # Deployment scripts
└── test/                     # Smart contract tests
```

## API Endpoints

### Drug Batches
- `GET /api/drug-batches` - List all drug batches
- `GET /api/drug-batches/:id` - Get specific batch
- `POST /api/drug-batches` - Create new batch
- `GET /api/drug-batches/verify/:batchId` - Verify batch

### Supply Chain
- `GET /api/supply-chain/:batchId` - Get batch timeline
- `POST /api/supply-chain/transfer` - Transfer ownership

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Testing

### Smart Contract Tests
```bash
npx hardhat test
```

### Frontend Tests
```bash
npm test
```

### End-to-End Testing
1. Deploy contracts locally
2. Start development server
3. Test complete user flows with MetaMask

## Production Deployment

### Frontend (Replit Deployment)
1. Configure production environment variables
2. Update contract addresses
3. Click "Deploy" in Replit interface

### Smart Contracts (Mainnet)
1. Configure mainnet network in Hardhat
2. Deploy with sufficient gas fees
3. Verify contracts on Etherscan
4. Update frontend contract addresses

### Database (Production)
1. Set up PostgreSQL database
2. Run migrations with Drizzle
3. Update DATABASE_URL

## Security Considerations

- **Private Keys**: Never commit private keys to version control
- **Smart Contracts**: Audit contracts before mainnet deployment
- **IPFS**: Verify file integrity when retrieving from IPFS
- **Access Control**: Validate user roles and permissions
- **Input Validation**: Sanitize all user inputs

## Troubleshooting

### Common Issues

1. **MetaMask Connection Failed**
   - Ensure MetaMask is installed and unlocked
   - Check network selection (Goerli for testnet)
   - Refresh page and reconnect

2. **Transaction Failed**
   - Check account has sufficient ETH for gas
   - Increase gas limit if needed
   - Verify contract is deployed correctly

3. **IPFS Upload Failed**
   - Check API keys are configured
   - Verify file size limits
   - Try alternative IPFS providers

4. **Database Connection Error**
   - Verify DATABASE_URL is correct
   - Check PostgreSQL is running
   - Run database migrations

### Getting Help

- Check browser console for errors
- Review smart contract events on Etherscan
- Verify environment variables are set
- Test with smaller file sizes for IPFS

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request with description

## License

MIT License - see LICENSE file for details

---

## Development Notes

This application is built for educational and demonstration purposes. For production use:

- Conduct thorough security audits
- Implement comprehensive testing
- Use mainnet with real ETH
- Set up proper monitoring and logging
- Consider gas optimization for smart contracts