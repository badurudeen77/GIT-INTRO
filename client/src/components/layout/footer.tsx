export function Footer() {
  return (
    <footer className="bg-surface border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-pills text-white text-sm"></i>
              </div>
              <h3 className="font-bold text-neutral">DrugAuth</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Secure pharmaceutical supply chain tracking powered by Ethereum and IPFS.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-neutral mb-4">Smart Contract</h4>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600">Network: Goerli Testnet</p>
              <p className="text-gray-600 font-mono">Contract: 0x1234...5678</p>
              <a
                href={`https://goerli.etherscan.io/address/${import.meta.env.VITE_CONTRACT_ADDRESS || ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80"
              >
                View on Etherscan
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-neutral mb-4">Resources</h4>
            <div className="space-y-2 text-sm">
              <a href="#" className="block text-gray-600 hover:text-primary">
                Documentation
              </a>
              <a href="#" className="block text-gray-600 hover:text-primary">
                API Reference
              </a>
              <a href="#" className="block text-gray-600 hover:text-primary">
                GitHub Repository
              </a>
              <a
                href="https://goerlifaucet.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-gray-600 hover:text-primary"
              >
                Get Goerli ETH
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-600">
            Built with React, Solidity, Hardhat & IPFS | Open Source
          </p>
        </div>
      </div>
    </footer>
  );
}
