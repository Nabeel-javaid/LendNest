import { DeployFunction } from 'hardhat-deploy/dist/types'

const deployFn: DeployFunction = async (hre) => {
  hre.log('----------')
  hre.log('')
  hre.log('LenderCommitmentForwarder G3: Proposing upgrade...')

  const LendNestV2 = await hre.contracts.get('LendNestV2')
  const marketRegistry = await hre.contracts.get('MarketRegistry')
  const lenderCommitmentForwarder = await hre.contracts.get(
    'LenderCommitmentForwarder'
  )

  await hre.upgrades.proposeBatchTimelock({
    title: 'Lender Commitment Forwarder Extension Upgrade',
    description: ` 
# LenderCommitmentForwarder_G2 (Extensions Upgrade)

* Upgrades the lender commitment forwarder so that trusted extensions can specify a specific recipient
* Adds a new function acceptCommitmentWithRecipient which is explicitly used with these new types.
`,
    _steps: [
      {
        proxy: lenderCommitmentForwarder,
        implFactory: await hre.ethers.getContractFactory(
          'LenderCommitmentForwarder'
        ),

        opts: {
          unsafeAllow: ['constructor', 'state-variable-immutable'],
          constructorArgs: [
            await LendNestV2.getAddress(),
            await marketRegistry.getAddress(),
          ],
        },
      },
    ],
  })

  hre.log('done.')
  hre.log('')
  hre.log('----------')

  return true
}

// tags and deployment
deployFn.id = 'lender-commitment-forwarder:g2-upgrade'
deployFn.tags = [
  'proposal',
  'upgrade',
  'lender-commitment-forwarder',
  'lender-commitment-forwarder:g2-upgrade',
]
deployFn.dependencies = [
  'market-registry:deploy',
  'LendNest-v2:deploy',
  'lender-commitment-forwarder:deploy',
  'lender-commitment-forwarder:extensions:deploy',
]
deployFn.skip = async (hre) => {
  // deploy LCF Staging separately for now
  return true
  return (
    !hre.network.live ||
    !['mainnet', 'polygon', 'arbitrum', 'goerli', 'sepolia'].includes(
      hre.network.name
    )
  )
}
export default deployFn
