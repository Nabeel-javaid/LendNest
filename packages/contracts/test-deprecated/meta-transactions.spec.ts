import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { BigNumber, Wallet } from 'ethers'
import hre from 'hardhat'
import { getMnemonic } from 'hardhat.config'
import { LendNestV2, LendNestV2Mock, MetaForwarder } from 'types/typechain'

import {
  DomainData,
  generateRequest,
  signMetatransaction,
  EIP2771Request,
} from '../meta/EIP2771-utils'

import { buildBid } from './LendNest-v2.spec'

chai.should()
chai.use(chaiAsPromised)

const { getNamedSigner, deployments } = hre

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface SetupOptions {}

interface SetupReturn {
  LendNestV2: LendNestV2Mock
  metaForwarder: MetaForwarder
  borrowerWallet: Wallet
}

const setup = deployments.createFixture<SetupReturn, SetupOptions>(
  async (hre, _opts) => {
    await hre.deployments.fixture(['LendNest-v2'], {
      keepExistingDeployments: false,
    })

    const mnemonicPhrase = getMnemonic()
    const borrowerWallet = hre.ethers.Wallet.fromMnemonic(
      mnemonicPhrase,
      `m/44'/60'/0'/0/1`
    ).connect(hre.ethers.provider)

    const LendNestV2 = await hre.contracts.get<LendNestV2Mock>('LendNestV2')

    const metaForwarder = await hre.contracts.get<MetaForwarder>(
      'MetaForwarder'
    )

    return {
      LendNestV2,
      metaForwarder,
      borrowerWallet,
    }
  }
)

describe('LendNestV2 Meta Transactions', () => {
  let LendNestV2: LendNestV2Mock
  let metaForwarder: MetaForwarder
  let borrower: Wallet
  let bidId: BigNumber

  beforeEach(async () => {
    const result = await setup()
    LendNestV2 = result.LendNestV2

    metaForwarder = result.metaForwarder
    borrower = result.borrowerWallet

    bidId = await LendNestV2.bidId()

    await LendNestV2.mockBid(
      buildBid({
        borrower: borrower.address,
      })
    )
  })

  describe('execute metatransaction', () => {
    it('should fail to cancel bid as deployer', async () => {
      const deployer = await getNamedSigner('deployer')

      await LendNestV2
        .connect(deployer)
        .cancelBid(bidId)
        .should.be.revertedWith(
          `ActionNotAllowed(${bidId.toString()}, "cancelBid", "Only the bid owner can cancel!")`
        )
    })

    it('should execute as deployer with offchain signature from borrower', async () => {
      const { data } = await LendNestV2.populateTransaction.cancelBid(bidId)
      if (!data) throw new Error('Could not generate tx data')

      const provider = hre.ethers.provider
      const from = borrower.address
      const to = LendNestV2.address
      const value = BigNumber.from(0)

      const request: EIP2771Request = await generateRequest(
        metaForwarder,
        provider,
        from,
        to,
        value,
        data
      )

      const domainData: DomainData = {
        contractName: 'LendNestMetaForwarder',
        contractVersion: '0.0.1',
        contractAddress: metaForwarder.address,
        chainId: hre.network.config.chainId ? hre.network.config.chainId : 1,
      }

      const signature: string = await signMetatransaction(
        request,
        domainData,
        borrower.privateKey
      )

      const deployer = await getNamedSigner('deployer')

      await metaForwarder.connect(deployer).execute(request, signature)
    })
  })
})
