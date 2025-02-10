// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketNFT is ERC721, Ownable {
    uint256 public nextTokenId;

    // Mapping to store the ticket price (optional, for additional features)
    mapping(uint256 => uint256) public ticketPrice;

    // Mapping to mark if a ticket has been validated (used)
    mapping(uint256 => bool) public ticketValidated;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    // Mint a new ticket NFT. Only the contract owner can mint tickets.
    function mintTicket(address to, uint256 price) external onlyOwner {
        uint256 tokenId = nextTokenId;
        _safeMint(to, tokenId);
        ticketPrice[tokenId] = price;
        nextTokenId++;
    }

    // Validate (or "use") a ticket. This could be called at event entrance.
    function validateTicket(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "You are not the ticket owner");
        require(!ticketValidated[tokenId], "Ticket already validated");
        ticketValidated[tokenId] = true;
    }
}
