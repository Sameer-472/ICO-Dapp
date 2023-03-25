// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.18;

/**
 * @title Ballot
 * @dev Implements voting process along with vote delegation
 */
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhiteList.sol";

contract CryptoDevs is ERC721Enumerable, Ownable {
    string _baseTokeURI;
    uint256 public _price = 0.01 ether;
    bool public _paused;
    uint256 public maxTokenIds = 20;
    uint256 public tokenIds;

    IWhiteList whitelist;
    bool public presaleStarted;
    uint256 public presaleEnded;

    modifier onlyWhenNotPaused() {
        require(!_paused, "Contract currently paused");
        _;
    }

    constructor(string memory baseURI, address whiteListAddress)
        ERC721("CryptoDev", "CD")
    {
        _baseTokeURI = baseURI;
        whitelist = IWhiteList(whiteListAddress);
    }

    // start the preSale for the whiteListed Address
    function startPreSale() public onlyOwner {
        presaleStarted = true;
        presaleEnded = block.timestamp + 5 minutes;
    }

    function presaleMint() public payable onlyWhenNotPaused {
        require(
            presaleStarted && block.timestamp < presaleEnded,
            "Pre sale is not running"
        );
        require(
            whitelist.whitelistedAddresses(msg.sender),
            "You are not whitelisted"
        );
        require(tokenIds < maxTokenIds, "Exceeded maximum crypto dev supply");
        require(msg.value >= _price, "Ether is not correct");
        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

    function mint() public payable onlyWhenNotPaused {
        require(
            presaleStarted && block.timestamp >= presaleEnded,
            "pre sale is not ended yet"
        );
        require(tokenIds < maxTokenIds, "Exceed maximum crypto devs supply");
        require(msg.value >= _price, "Ether sent is not correct");
        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokeURI;
    }

    function setPaused(bool val) public onlyOwner {
        _paused = val;
    }

    function withdraw() public onlyOwner{
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent,) = _owner.call{value: amount}("");
        require(sent , "Failed to send ether");
    }

    receive() external payable{}

    fallback() external payable{}
}
