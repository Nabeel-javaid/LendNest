// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import { Testable } from "./Testable.sol";
import { LendNestV2Context } from "../contracts/LendNestV2Context.sol";
import { IMarketRegistry } from "../contracts/interfaces/IMarketRegistry.sol";
import { LendNestV2MarketForwarder_G1 } from "../contracts/LendNestV2MarketForwarder_G1.sol";

import { User } from "./Test_Helpers.sol";

import "../contracts/mock/MarketRegistryMock.sol";

contract MarketForwarder_Override is LendNestV2MarketForwarder_G1 {
    constructor(address LendNestV2, address marketRegistry)
        LendNestV2MarketForwarder_G1(LendNestV2, marketRegistry)
    {}

    function forwardCall(bytes memory _data, address _msgSender)
        public
        returns (bytes memory)
    {
        return super._forwardCall(_data, _msgSender);
    }
}
