// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract DrugAuth is ERC721, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct Drug {
        string batchId;
        string drugName;
        string manufacturer;
        uint256 expiryDate;
        string ipfsHash;
        address currentOwner;
        uint256 timestamp;
        bool isActive;
    }

    struct TransferEvent {
        address from;
        address to;
        uint256 timestamp;
        string eventType; // "manufacture", "transfer", "verify"
    }

    mapping(uint256 => Drug) public drugs;
    mapping(string => uint256) public batchIdToTokenId;
    mapping(uint256 => TransferEvent[]) public drugHistory;
    mapping(address => string) public userRoles;

    event DrugRegistered(
        uint256 indexed tokenId,
        string batchId,
        address indexed owner,
        string drugName,
        string manufacturer
    );

    event OwnershipTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        string eventType
    );

    event RoleAssigned(address indexed user, string role);

    modifier onlyAuthorizedRole(string memory role) {
        require(
            keccak256(abi.encodePacked(userRoles[msg.sender])) == keccak256(abi.encodePacked(role)) ||
            keccak256(abi.encodePacked(userRoles[msg.sender])) == keccak256(abi.encodePacked("manufacturer")),
            "Unauthorized role"
        );
        _;
    }

    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not the token owner");
        _;
    }

    constructor() ERC721("DrugAuth", "DRUG") {
        // Assign owner as manufacturer by default
        userRoles[msg.sender] = "manufacturer";
    }

    function registerDrug(
        string memory batchId,
        string memory drugName,
        string memory manufacturer,
        uint256 expiryDate,
        string memory ipfsHash
    ) public returns (uint256) {
        require(bytes(batchId).length > 0, "Batch ID cannot be empty");
        require(bytes(drugName).length > 0, "Drug name cannot be empty");
        require(bytes(manufacturer).length > 0, "Manufacturer cannot be empty");
        require(expiryDate > block.timestamp, "Expiry date must be in the future");
        require(batchIdToTokenId[batchId] == 0, "Batch ID already exists");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _safeMint(msg.sender, tokenId);

        drugs[tokenId] = Drug({
            batchId: batchId,
            drugName: drugName,
            manufacturer: manufacturer,
            expiryDate: expiryDate,
            ipfsHash: ipfsHash,
            currentOwner: msg.sender,
            timestamp: block.timestamp,
            isActive: true
        });

        batchIdToTokenId[batchId] = tokenId;

        // Record the initial manufacturing event
        drugHistory[tokenId].push(TransferEvent({
            from: address(0),
            to: msg.sender,
            timestamp: block.timestamp,
            eventType: "manufacture"
        }));

        emit DrugRegistered(tokenId, batchId, msg.sender, drugName, manufacturer);

        return tokenId;
    }

    function transferOwnership(
        uint256 tokenId,
        address to,
        string memory eventType
    ) public onlyTokenOwner(tokenId) {
        require(to != address(0), "Cannot transfer to zero address");
        require(to != ownerOf(tokenId), "Cannot transfer to current owner");
        require(drugs[tokenId].isActive, "Drug is not active");
        require(drugs[tokenId].expiryDate > block.timestamp, "Drug has expired");

        address from = ownerOf(tokenId);
        
        _transfer(from, to, tokenId);
        drugs[tokenId].currentOwner = to;

        // Record the transfer event
        drugHistory[tokenId].push(TransferEvent({
            from: from,
            to: to,
            timestamp: block.timestamp,
            eventType: eventType
        }));

        emit OwnershipTransferred(tokenId, from, to, eventType);
    }

    function verifyDrug(uint256 tokenId) public view returns (Drug memory) {
        require(_exists(tokenId), "Drug does not exist");
        return drugs[tokenId];
    }

    function verifyDrugByBatchId(string memory batchId) public view returns (Drug memory) {
        uint256 tokenId = batchIdToTokenId[batchId];
        require(tokenId != 0, "Batch ID does not exist");
        return drugs[tokenId];
    }

    function getDrugHistory(uint256 tokenId) public view returns (TransferEvent[] memory) {
        require(_exists(tokenId), "Drug does not exist");
        return drugHistory[tokenId];
    }

    function deactivateDrug(uint256 tokenId) public onlyTokenOwner(tokenId) {
        drugs[tokenId].isActive = false;
    }

    function assignRole(address user, string memory role) public onlyOwner {
        userRoles[user] = role;
        emit RoleAssigned(user, role);
    }

    function getUserRole(address user) public view returns (string memory) {
        return userRoles[user];
    }

    function getDrugsByOwner(address owner) public view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](balance);
        
        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return tokenIds;
    }

    function totalDrugs() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    // Override required functions
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
