import { DeployFunction } from 'hardhat-deploy/dist/types'

const deployFn: DeployFunction = async (hre) => {
  const LendNestV2 = await hre.contracts.get('LendNestV2')

  const reputationManager = await hre.deployProxy('ReputationManager', {
    initArgs: [await LendNestV2.getAddress()],
  })

  return true
}

// tags and deployment
deployFn.id = 'reputation-manager:deploy'
deployFn.tags = ['reputation-manager', 'reputation-manager:deploy']
deployFn.dependencies = ['LendNest-v2:deploy']
export default deployFn
