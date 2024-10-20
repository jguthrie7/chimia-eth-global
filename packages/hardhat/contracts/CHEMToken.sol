// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CHEMToken is ERC20, Ownable {
    // 1 million tokens with 18 decimals (ERC20 standard)
    uint256 public initialSupply = 1_000_000 * 10 ** decimals();

    // Constructor to mint the initial supply to a specified address
    constructor(address mintTo) ERC20("CHEM", "CHEM") Ownable(msg.sender) {
        require(mintTo != address(0), "Cannot mint to zero address");
        // Mint the entire supply to the specified address
        _mint(mintTo, initialSupply);
    }
}