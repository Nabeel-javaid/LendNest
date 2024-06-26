import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { Signer } from 'ethers'
import hre from 'hardhat'
import { LendNestASRegistry } from 'types/typechain'

chai.should()
chai.use(chaiAsPromised)

const { getNamedSigner, getNamedAccounts, ethers, toBN, deployments } = hre

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface SetupOptions {}

interface SetupReturn {
  LendNestASRegistry: LendNestASRegistry
  deployer: string
}

const setup = deployments.createFixture<SetupReturn, SetupOptions>(
  async (hre, _opts) => {
    await hre.deployments.fixture('LendNest-as', {
      keepExistingDeployments: false,
    })

    const LendNestASRegistry = await hre.contracts.get<LendNestASRegistry>(
      'LendNestASRegistry'
    )

    const deployer = await (await getNamedSigner('deployer')).getAddress()

    return {
      LendNestASRegistry,
      deployer,
    }
  }
)

describe('LendNestASRegistry', () => {
  let LendNestASRegistry: LendNestASRegistry
  let deployer: string
  const ZERO_BYTES = '0x'
  const ADDRESS_ZERO = ethers.constants.AddressZero

  beforeEach(async () => {
    const result = await setup()
    LendNestASRegistry = result.LendNestASRegistry
    deployer = result.deployer
  })

  describe('construction', () => {
    it('LendNestASRegistry should report a version', async () => {
      expect(await LendNestASRegistry.VERSION()).to.eq('0.8')
    })
    it('should initialize without any Ss', async () => {
      expect(await LendNestASRegistry.getASCount()).to.equal(toBN(0))
    })
  })
  const getUUID = (schemaAsBytes: string, resolverAddress: string): string => {
    return ethers.utils.solidityKeccak256(
      ['bytes', 'address'],
      [schemaAsBytes, resolverAddress]
    )
  }
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  describe('registration', async () => {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    const register = async (schemaAsBytes: string, resolverAddress: string) => {
      const uuid = getUUID(schemaAsBytes, resolverAddress)
      const index = toBN(await LendNestASRegistry.callStatic.getASCount()).add(
        '1'
      )
      const retUUID = await LendNestASRegistry.callStatic.register(
        schemaAsBytes,
        resolverAddress
      )
      const res = await LendNestASRegistry.register(
        schemaAsBytes,
        resolverAddress
      )

      expect(retUUID).to.eq(uuid)
      await expect(res)
        .to.emit(LendNestASRegistry, 'Registered')
        .withArgs(uuid, index, schemaAsBytes, resolverAddress, deployer)
      expect(await LendNestASRegistry.getASCount()).to.eq(index)

      const asRecord = await LendNestASRegistry.getAS(uuid)
      expect(asRecord.uuid).to.eq(uuid)
      expect(asRecord.index).to.eq(index)
      expect(asRecord.schema).to.eq(schemaAsBytes)
      expect(asRecord.resolver).to.eq(resolverAddress)
    }
    it('should allow to register an AS withour a schema', async () => {
      await register(ZERO_BYTES, deployer)
    })
    it('should allow to register an AS without a resolver', async () => {
      await register('0x1234', ADDRESS_ZERO)
    })
    it('should allow to register an AS without neither a schema or a resolver', async () => {
      await register(ZERO_BYTES, ADDRESS_ZERO)
    })
    it('should not allow to register the same schema and resolver twice', async () => {
      await register('0x1234', ADDRESS_ZERO)
      await expect(register('0x1234', ADDRESS_ZERO)).to.be.revertedWith(
        'AlreadyExists'
      )
    })
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  describe('AS querying', async () => {
    it('should return an AS', async () => {
      const schemaAsBytes = '0x1234'

      await LendNestASRegistry.register(schemaAsBytes, deployer)
      const uuid = getUUID(schemaAsBytes, deployer)
      const asRecord = await LendNestASRegistry.getAS(uuid)
      expect(asRecord.uuid).to.eq(uuid, 'Incorrect UUID')
      expect(asRecord.index).to.eq('1', 'Incorrect Index')
      expect(asRecord.schema).to.eq(schemaAsBytes, 'Incorrect schema')
      expect(asRecord.resolver).to.eq(deployer, 'Incorrect resolver')
    })
    it('should return an empty AS given non-existant id', async () => {
      const ZERO_BYTES32 =
        '0x0000000000000000000000000000000000000000000000000000000000000000'
      const asRecord = await LendNestASRegistry.getAS(
        ethers.utils.formatBytes32String('BAD')
      )
      expect(asRecord.uuid).to.eq(ZERO_BYTES32, 'Incorrect UUID')
      expect(asRecord.index).to.eq(toBN('0'), 'Incorrect Index')
      expect(asRecord.schema).to.eq(ZERO_BYTES, 'Incorrect schema')
      expect(asRecord.resolver).to.eq(ADDRESS_ZERO, 'Incorrect resolver')
    })
  })
})
