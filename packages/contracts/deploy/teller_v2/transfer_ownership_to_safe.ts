import { DeployFunction } from 'hardhat-deploy/dist/types'
import { logTxLink } from 'helpers/logTxLink'
import { LendNestV2 } from 'types/typechain'

const deployFn: DeployFunction = async (hre) => {
  hre.log('----------')
  hre.log('')
  hre.log('LendNestV2: Transferring Ownership to Safe Multisig')
  hre.log('')

  const { deployer, protocolOwnerSafe } = await hre.getNamedAccounts()
  const LendNestV2 = await hre.contracts.get<LendNestV2>('LendNestV2')
  const currentOwner = await LendNestV2.owner()

  if (deployer === currentOwner) {
    const tx = await LendNestV2.transferOwnership(protocolOwnerSafe)
    await tx.wait(1) //wait one block

    hre.log(
      `  ✅  LendNestV2 ownership transferred to Safe Multisig (${protocolOwnerSafe})`
    )

    await logTxLink(hre, tx.hash)
  } else if (protocolOwnerSafe === currentOwner) {
    hre.log('  ✅  LendNestV2 ownership is already set to the Safe Multisig')
  } else {
    throw new Error(
      `  ❌  Cannot transfer LendNestV2 ownership... Must be run by current owner (${currentOwner}).`
    )
  }

  hre.log('done.')
  hre.log('')
  hre.log('----------')

  return true
}

// tags and deployment
deployFn.id = 'LendNest-v2:transfer-ownership-to-safe'
deployFn.tags = ['LendNest-v2', 'LendNest-v2:transfer-ownership-to-safe']
deployFn.dependencies = ['LendNest-v2:init']
export default deployFn
