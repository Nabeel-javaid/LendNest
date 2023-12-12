import { DeployFunction } from 'hardhat-deploy/dist/types'
import { logTxLink } from 'helpers/logTxLink'
import { LenderManager } from 'types/typechain'

const deployFn: DeployFunction = async (hre) => {
  hre.log('----------')
  hre.log('')
  hre.log('Lender Manager: Transferring Ownership to LendNestV2...', {
    nl: false,
  })

  const LendNestV2 = await hre.contracts.get('LendNestV2')
  const lenderManager = await hre.contracts.get<LenderManager>('LenderManager')

  const tx = await lenderManager.transferOwnership(LendNestV2)
  await tx.wait(1)

  hre.log('done.')
  await logTxLink(hre, tx.hash)
  hre.log('')
  hre.log('----------')

  return true
}

// tags and deployment
deployFn.id = 'lender-manager:transfer-ownership'
deployFn.tags = ['lender-manager', 'lender-manager:transfer-ownership']
deployFn.dependencies = ['LendNest-v2', 'lender-manager:deploy']
export default deployFn
