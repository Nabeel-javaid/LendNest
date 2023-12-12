import { DeployFunction } from 'hardhat-deploy/dist/types'

const deployFn: DeployFunction = async (hre) => {
  const trustedForwarder = await hre.contracts.get('MetaForwarder')
  const v2Calculations = await hre.deployments.get('V2Calculations')

  const LendNestV2 = await hre.deployProxy('LendNestV2', {
    unsafeAllow: [
      'constructor',
      'state-variable-immutable',
      'external-library-linking',
    ],
    constructorArgs: [await trustedForwarder.getAddress()],
    initializer: false,
    libraries: {
      V2Calculations: v2Calculations.address,
    },
  })

  return true
}

// tags and deployment
deployFn.id = 'LendNest-v2:deploy'
deployFn.tags = ['LendNest-v2', 'LendNest-v2:deploy']
deployFn.dependencies = ['meta-forwarder:deploy', 'LendNest-v2:v2-calculations']
export default deployFn
