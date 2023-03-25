// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.18;
import "./ICryptoDev.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ICO is ERC20, Ownable {
    uint256 public constant tokenPrice = 0.001 ether;
    uint256 public constant tokenPerNFT = 10 * (10**18);
    uint256 public constant maxTokenSupply = 10000 * (10**18);
    ICryptoDev CryptoDevNFT;

    mapping(uint256 => bool) public tokenIdsClaimed;

    constructor(address _cryptoDevsContract) ERC20("Crypto Dev Token", "CD") {
        CryptoDevNFT = ICryptoDev(_cryptoDevsContract);
    }

    // function requiredAmount(uint amount) public pure returns (uint256){
    //     uint256 _requiredAmount = tokenPrice * amount;
    //     uint256 amountWithDecimal = amount * 10 ** 18;
    //     return _requiredAmount;
    // }

    function mint(uint256 amount) public payable {
        uint256 requiredAmount = tokenPrice * amount;
        require(msg.value >= requiredAmount, "Ether sent is incorrect");
        uint256 amountWithDecimal = amount * 10**18;
        require(
            totalSupply() + amountWithDecimal <= maxTokenSupply,
            "Exceeds the max token supply"
        );
        _mint(msg.sender, amountWithDecimal);
    }

    function claim() public {
        address sender = msg.sender;
        uint256 balance = CryptoDevNFT.balanceOf(sender);
        require(balance > 0, "You don't own any Crypto Dev NFT");
        uint256 amount = 0;
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenIds = CryptoDevNFT.tokenOfOwnerByIndex(sender, i);
            if (!tokenIdsClaimed[tokenIds]) {
                amount += 1;
                tokenIdsClaimed[tokenIds] = true;
            }
        }
        require(amount > 0, "you have already claimed all the tokens");
        _mint(sender, amount * tokenPerNFT);
        //  return balance;
    }

    function withDraw() public onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "your balance is empty");
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "transection failed");
    }

    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}
}
