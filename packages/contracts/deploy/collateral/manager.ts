import { DeployFunction } from 'hardhat-deploy/dist/types'

const deployFn: DeployFunction = async (hre) => {
  const collateralEscrowBeacon = await hre.contracts.get(
    'CollateralEscrowBeacon'
  )
  const LendNestV2 = await hre.contracts.get('LendNestV2')

  const collateralManager = await hre.deployProxy('CollateralManager', {
    initArgs: [
      await collateralEscrowBeacon.getAddress(),
      await LendNestV2.getAddress(),
    ],
  })

  return true
}

// tags and deployment
deployFn.id = 'collateral:manager:deploy'
deployFn.tags = [
  'collateral',
  'collateral:manager',
  'collateral:manager:deploy',
]
deployFn.dependencies = ['LendNest-v2:deploy', 'collateral:escrow-beacon:deploy']
export default deployFn
