# Overview

DrugAuth is a decentralized application (DApp) that provides secure tracking of pharmaceutical drug batches through every stage of the supply chain—from manufacturing to customer delivery. The system leverages Ethereum blockchain technology for immutable record keeping and IPFS for secure document storage, ensuring complete traceability and authenticity verification of pharmaceutical products.

The application addresses critical needs in pharmaceutical supply chains by providing tamper-proof records, complete traceability from manufacturer to end customer, secure document storage, role-based access control, and real-time drug authenticity verification via QR codes.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes (Latest)

## December 2024 - Project Completion and Documentation
- **Fixed TypeScript compilation errors**: Resolved missing type declarations, BigInt literals, and property mismatches
- **Installed blockchain dependencies**: Added ethers, hardhat, qrcode, and related packages for full blockchain functionality
- **Updated IPFS integration**: Replaced deprecated web3.storage with mock implementation for development
- **Environment variable fixes**: Corrected client-side environment variable usage (import.meta.env vs process.env)
- **Comprehensive README**: Created detailed setup instructions, usage guide, and troubleshooting documentation
- **Application status**: Successfully running with all core features implemented and accessible

# System Architecture

## Full-Stack Architecture
The application follows a monolithic full-stack architecture with clear separation between frontend and backend concerns. The main entry point is a Node.js/Express server that serves both API endpoints and the React frontend in production, while using Vite for development.

## Frontend Architecture
- **Framework**: React with Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent UI design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Blockchain Integration**: Ethers.js for Ethereum blockchain interactions and MetaMask wallet integration
- **Form Handling**: React Hook Form with Zod schema validation for type-safe form management

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **API Design**: RESTful API with clear endpoint structure for drug batches, supply chain events, and verification
- **Storage Strategy**: Hybrid approach using in-memory storage for development and PostgreSQL for production

## Blockchain Layer
- **Smart Contracts**: Solidity contracts deployed on Ethereum Goerli testnet
- **Development Tools**: Hardhat for contract compilation, testing, and deployment
- **Gas Optimization**: Optimized contract settings with 200 runs for efficient deployment
- **Network Configuration**: Support for both local development (Hardhat network) and Goerli testnet

## Data Storage Solutions
- **Primary Database**: PostgreSQL with structured tables for drug batches, supply chain events, and user management
- **Schema Management**: Drizzle ORM with TypeScript schemas ensuring type safety across the application
- **Off-chain Storage**: IPFS via Web3.Storage for storing certificates and documents (free up to 5GB)
- **Session Management**: PostgreSQL-based session storage using connect-pg-simple

## Authentication and Authorization
- **Wallet-Based Authentication**: MetaMask wallet integration for user authentication
- **Role-Based Access Control**: Five distinct roles (manufacturer, producer, distributor, pharmacist, customer) with appropriate permissions
- **Address Validation**: Ethereum address validation and verification throughout the application

## Key Features Implementation
- **Drug Registration**: Form-based interface for entering drug metadata with IPFS certificate upload
- **Ownership Tracking**: Smart contract-based transfer system maintaining complete audit trail
- **Verification System**: Batch ID-based drug lookup with full transaction history display
- **QR Code Generation**: Dynamic QR code creation for easy drug lifecycle tracking
- **Supply Chain Timeline**: Visual representation of drug journey through supply chain stages

# External Dependencies

## Blockchain Infrastructure
- **Ethereum Goerli Testnet**: Primary blockchain network for smart contract deployment
- **Infura**: Ethereum API provider for reliable blockchain connectivity
- **MetaMask**: Browser extension wallet for user authentication and transaction signing
- **Etherscan**: Block explorer integration for contract verification and transaction tracking

## Storage Services
- **Web3.Storage**: IPFS storage service for pharmaceutical certificates and documents
- **Neon Database**: PostgreSQL hosting service via @neondatabase/serverless

## Development and Deployment
- **Vite**: Frontend build tool and development server
- **Hardhat**: Ethereum development environment for smart contract development
- **OpenZeppelin**: Smart contract security library for secure contract patterns

## UI and Component Libraries
- **Radix UI**: Headless UI components for accessible and customizable interface elements
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide React**: Icon library for consistent iconography
- **QRCode**: Library for generating QR codes for drug verification

## API and Network
- **TanStack Query**: Server state management and API caching
- **Wouter**: Lightweight routing library for single-page application navigation
- **React Hook Form**: Form state management with validation
- **Zod**: Schema validation library for type-safe data handling

## Testing and Quality
- **TypeScript**: Static type checking throughout the application
- **ESLint**: Code linting for consistent code quality
- **Hardhat Testing Framework**: Smart contract testing infrastructure