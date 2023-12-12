// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "../interfaces/ILenderCommitmentForwarder.sol";
import "./LenderCommitmentForwarder_G1.sol";

contract LenderCommitmentForwarder is LenderCommitmentForwarder_G1 {
    constructor(address _LendNestV2, address _marketRegistry)
        LenderCommitmentForwarder_G1(_LendNestV2, _marketRegistry)
    {
        _disableInitializers();
    }
}
