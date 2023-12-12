import { DeployFunction } from 'hardhat-deploy/dist/types'

const deployFn: DeployFunction = async (hre) => {
  const { deployer } = await hre.getNamedAccounts()
  const v2Calculations = await hre.deployments.deploy('V2Calculations', {
    from: deployer,
  })
}

// tags and deployment
deployFn.id = 'LendNest-v2:v2-calculations'
deployFn.tags = ['LendNest-v2', 'LendNest-v2:v2-calculations']
deployFn.dependencies = ['']
export default deployFn
