import { DeployFunction } from 'hardhat-deploy/dist/types'
import { logTxLink } from 'helpers/logTxLink'
import { LendNestV2 } from 'types/typechain'

const deployFn: DeployFunction = async (hre) => {
  hre.log('----------')
  hre.log('')
  hre.log('LendNestV2: Initializing...', { nl: false })

  const protocolFee = 5 // 0.05%

  const marketRegistry = await hre.contracts.get('MarketRegistry')
  const reputationManager = await hre.contracts.get('ReputationManager')
  const lenderCommitmentForwarder = await hre.contracts.get(
    'LenderCommitmentForwarder'
  )
  const collateralManager = await hre.contracts.get('CollateralManager')
  const lenderManager = await hre.contracts.get('LenderManager')
  const escrowVault = await hre.contracts.get('EscrowVault')

  const LendNestV2 = await hre.contracts.get<LendNestV2>('LendNestV2')
  const tx = await LendNestV2.initialize(
    protocolFee,
    marketRegistry,
    reputationManager,
    lenderCommitmentForwarder,
    collateralManager,
    lenderManager,
    escrowVault
  )
  await tx.wait(1) // wait one block

  hre.log('done.')
  await logTxLink(hre, tx.hash)
  hre.log('')
  hre.log('----------')

  return true
}

// tags and deployment
deployFn.id = 'LendNest-v2:init'
deployFn.tags = ['LendNest-v2', 'LendNest-v2:init']
deployFn.dependencies = [
  'LendNest-v2:deploy',
  'market-registry:deploy',
  'reputation-manager:deploy',
  'lender-commitment-forwarder:deploy',
  'collateral:manager:deploy',
  'lender-manager:deploy',
  'escrow-vault:deploy',
]
export default deployFn
