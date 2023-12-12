import {
  ATTEST_TYPED_SIGNATURE,
  Delegation,
  REVOKE_TYPED_SIGNATURE,
} from '@ethereum-attestation-service/eas-sdk'
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import hre from 'hardhat'
import { LendNestASEIP712Verifier } from 'types/typechain'

chai.should()
chai.use(chaiAsPromised)

const { ethers, toBN, deployments } = hre

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface SetupOptions {}

interface SetupReturn {
  LendNestASEIP712Verifier: LendNestASEIP712Verifier
}

const setup = deployments.createFixture<SetupReturn, SetupOptions>(
  async (hre, _opts) => {
    await hre.deployments.fixture('LendNest-as', {
      keepExistingDeployments: false,
    })

    const LendNestASEIP712Verifier =
      await hre.contracts.get<LendNestASEIP712Verifier>('LendNestASEIP712Verifier')

    return {
      LendNestASEIP712Verifier,
    }
  }
)

describe('LendNestASEIP712Verifier', () => {
  let LendNestASEIP712Verifier: LendNestASEIP712Verifier

  beforeEach(async () => {
    const result = await setup()
    LendNestASEIP712Verifier = result.LendNestASEIP712Verifier
  })
  it('should report a version', async () => {
    expect(await LendNestASEIP712Verifier.VERSION()).to.eq('0.8')
  })
  it('should return the correct domain separator', async () => {
    const delegation = new Delegation({
      address: LendNestASEIP712Verifier.address,
      version: await LendNestASEIP712Verifier.VERSION(),
      chainId: (await ethers.provider.getNetwork()).chainId,
    })
    expect(await LendNestASEIP712Verifier.DOMAIN_SEPARATOR()).to.eq(
      delegation.getDomainSeparator()
    )
  })
  const {
    utils: { keccak256, toUtf8Bytes },
  } = ethers
  it('should return the attest type hash', async () => {
    expect(await LendNestASEIP712Verifier.ATTEST_TYPEHASH()).to.eq(
      keccak256(toUtf8Bytes(ATTEST_TYPED_SIGNATURE))
    )
  })
  it('should return the revoke type hash', async () => {
    expect(await LendNestASEIP712Verifier.REVOKE_TYPEHASH()).to.eq(
      keccak256(toUtf8Bytes(REVOKE_TYPED_SIGNATURE))
    )
  })
})
