// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.16;

interface ICryptoDev{
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId);

    function balanceOf(address owner) external view returns (uint256 balance);
}

