// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Importing OpenZeppelin's ERC721 and ERC721URIStorage
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; // Import ERC-20 interface

contract Experiments is ERC721URIStorage, Ownable {
    uint256 private _currentTokenId;
    IERC20 private CHEM; // Reference to the ERC-20 token contract
    uint256 private constant TOKENS_PER_MINT = 10 * 10**18; // 10 tokens with 18 decimals

    // Constructor to set the name and symbol of the NFT collection
    constructor() ERC721("Chimia Experiments", "CHIMIA") Ownable(msg.sender) {}

    function setCHEM(address chemAddress) public onlyOwner {
        CHEM = IERC20(chemAddress);
    }

    // Mint function to create a new NFT with a specific URI
    function mint(address to, string memory tokenURI) public {
        // Increment the token ID
        _currentTokenId += 1;

        // Mint the new token to the 'to' address
        _safeMint(to, _currentTokenId);

        // Set the token URI for the minted token
        _setTokenURI(_currentTokenId, tokenURI);

        // Transfer 10 ERC-20 tokens to the 'to' address
        require(CHEM.transfer(to, TOKENS_PER_MINT), "ERC-20 transfer failed");
    }
}