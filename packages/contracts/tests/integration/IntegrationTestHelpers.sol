pragma solidity >=0.8.0 <0.9.0;
// SPDX-License-Identifier: MIT

import { LendNestV2 } from "../../contracts/LendNestV2.sol";

import "../../contracts/EAS/LendNestAS.sol";
import "../../contracts/EAS/LendNestASEIP712Verifier.sol";
import "../../contracts/EAS/LendNestASRegistry.sol";

import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

import { MarketRegistry } from "../../contracts/MarketRegistry.sol";
import { EscrowVault } from "../../contracts/EscrowVault.sol";
import { LenderManager } from "../../contracts/LenderManager.sol";
import { LenderCommitmentForwarder_G3 } from "../../contracts/LenderCommitmentForwarder/LenderCommitmentForwarder_G3.sol";
import { CollateralManager } from "../../contracts/CollateralManager.sol";
import { CollateralEscrowV1 } from "../../contracts/escrow/CollateralEscrowV1.sol";

import { ReputationManager } from "../../contracts/ReputationManager.sol";
import { IMarketRegistry } from "../../contracts/interfaces/IMarketRegistry.sol";

library IntegrationTestHelpers {
    function deployMarketRegistry() public returns (address) {
        IASRegistry iasRegistry = new LendNestASRegistry();
        IEASEIP712Verifier ieaseip712verifier = new LendNestASEIP712Verifier();

        LendNestAS LendNestAS = new LendNestAS((iasRegistry), (ieaseip712verifier));
        MarketRegistry marketRegistry = new MarketRegistry();

        marketRegistry.initialize(LendNestAS);

        return address(marketRegistry);
    }

    function deployIntegrationSuite() public returns (LendNestV2 LendNestV2_) {
        address trustedForwarder = address(0);
        LendNestV2 LendNestV2 = new LendNestV2(trustedForwarder);

        uint16 _protocolFee = 100;
        address _marketRegistry = deployMarketRegistry();
        ReputationManager _reputationManager = new ReputationManager();

        LenderCommitmentForwarder_G3 _lenderCommitmentForwarder = new LenderCommitmentForwarder_G3(
                address(LendNestV2),
                address(_marketRegistry)
            );

        CollateralEscrowV1 escrowImplementation = new CollateralEscrowV1();
        // Deploy beacon contract with implementation
        UpgradeableBeacon escrowBeacon = new UpgradeableBeacon(
            address(escrowImplementation)
        );

        CollateralManager _collateralManager = new CollateralManager();
        LenderManager _lenderManager = new LenderManager(
            IMarketRegistry(_marketRegistry)
        );
        EscrowVault _escrowVault = new EscrowVault();

        _collateralManager.initialize(address(escrowBeacon), address(LendNestV2));
        _lenderManager.initialize();
        _reputationManager.initialize(address(LendNestV2));

        LendNestV2.initialize(
            _protocolFee,
            address(_marketRegistry),
            address(_reputationManager),
            address(_lenderCommitmentForwarder),
            address(_collateralManager),
            address(_lenderManager),
            address(_escrowVault)
        );

        return LendNestV2;
    }
}
