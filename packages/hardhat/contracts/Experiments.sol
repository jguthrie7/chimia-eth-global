// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Importing OpenZeppelin's ERC721 and ERC721URIStorage
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Experiments is ERC721URIStorage, Ownable {
    uint256 private _currentTokenId;

    // Constructor to set the name and symbol of the NFT collection
    constructor() ERC721("Chimia Experiments", "CHIMIA") Ownable(msg.sender) {

    }

    // Mint function to create a new NFT with a specific URI
    function mint(address to, string memory tokenURI) public {
        // Increment the token ID
        _currentTokenId += 1;

        // Mint the new token to the 'to' address
        _safeMint(to, _currentTokenId);

        // Set the token URI for the minted token
        _setTokenURI(_currentTokenId, tokenURI);
    }
}