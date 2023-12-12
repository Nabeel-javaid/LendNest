import { DeployFunction } from 'hardhat-deploy/dist/types'

const deployFn: DeployFunction = async (hre) => {
  const LendNestV2 = await hre.contracts.get('LendNestV2')
  const marketRegistry = await hre.contracts.get('MarketRegistry')

  const lenderCommitmentForwarderStaging = await hre.deployProxy(
    'LenderCommitmentForwarderStaging',
    {
      unsafeAllow: ['constructor', 'state-variable-immutable'],
      constructorArgs: [
        await LendNestV2.getAddress(),
        await marketRegistry.getAddress(),
      ],
    }
  )

  return true
}

// tags and deployment
deployFn.id = 'lender-commitment-forwarder:staging:deploy'
deployFn.tags = [
  'lender-commitment-forwarder',
  'lender-commitment-forwarder:staging',
  'lender-commitment-forwarder:staging:deploy',
]
deployFn.dependencies = ['LendNest-v2:deploy', 'market-registry:deploy']
export default deployFn
