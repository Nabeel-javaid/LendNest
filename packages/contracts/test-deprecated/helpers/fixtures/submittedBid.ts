import {
  BigNumber as BN,
  BigNumberish,
  ContractTransaction,
  Signer,
} from 'ethers'
import hre, { deployments } from 'hardhat'
import { Address } from 'helpers/types'
import moment from 'moment'
import { ERC20, LendNestV2 } from 'types/typechain'

import { getTokens } from '~~/config'

export interface SubmittedBidOptions {
  LendNestV2?: LendNestV2
  borrower?: Signer
  lendingToken?: Address
  marketplaceId?: BigNumberish
  amount?: BigNumberish
  amountBN?: BigNumberish
  duration?: moment.Duration
  apr?: BigNumberish
  dataHash?: string
  receiver?: Address
}

export interface SubmittedBidReturn
  extends SubmittedBidMainReturn,
    SubmittedBidValues {
  bidId: BN
}

export interface SubmittedBidMainReturn {
  tx: ContractTransaction
}

export interface SubmittedBidValues {
  LendNestV2: LendNestV2
  borrower: {
    signer: Signer
    address: string
  }
  receiver: Address
  lendingToken: ERC20
  amount: BN
  marketplaceId: BigNumberish
}

const same = async (
  options?: SubmittedBidOptions
): Promise<{
  values: SubmittedBidValues
  txPromise: Promise<ContractTransaction>
}> => {
  const { contracts, getNamedSigner, ethers, toBN } = hre

  const LendNestV2 =
    options?.LendNestV2 ?? (await contracts.get<LendNestV2>('LendNestV2'))
  const borrower = options?.borrower ?? (await getNamedSigner('borrower'))
  const lendingToken = await contracts.get<ERC20>('ERC20', {
    at: options?.lendingToken ?? (await getTokens(hre)).all.DAI,
  })

  // Get values or defaults
  const amount = options?.amount
    ? toBN(options.amount, await lendingToken.decimals())
    : options?.amountBN
    ? BN.from(options.amountBN)
    : toBN(10000, await lendingToken.decimals())
  const duration = options?.duration ?? moment.duration(3, 'years')
  const apr = options?.apr ?? 1000
  const dataHash = options?.dataHash ?? 'ipfs://QmMyDataHash'
  const marketplaceId = options?.marketplaceId ?? 1

  // Common values used in this fixture
  const values: SubmittedBidValues = {
    LendNestV2,
    borrower: {
      signer: borrower,
      address: await borrower.getAddress(),
    },
    receiver: options?.receiver ?? ethers.constants.AddressZero,
    lendingToken,
    amount,
    marketplaceId,
  }

  // Execute the transaction
  const txPromise = LendNestV2
    .connect(borrower)
    ['submitBid(address,uint256,uint256,uint32,uint16,string,address)'](
      lendingToken.address,
      marketplaceId,
      amount,
      duration.asSeconds(),
      apr,
      dataHash,
      values.receiver
    )

  return {
    values,
    txPromise,
  }
}

export const submitBid = async (
  options?: SubmittedBidOptions
): Promise<SubmittedBidReturn> => {
  const { values, txPromise } = await same(options)

  // Execute the transaction
  const tx = await txPromise

  const bidId = await getBidId(tx)
  if (!bidId) throw new Error('No bid ID after submitting')

  return {
    ...values,
    bidId,
    tx,
  }
}

type TrySubmitBidReturn = Omit<SubmittedBidReturn, 'bidId' | 'tx'> &
  Partial<SubmittedBidReturn> & {
    txPromise: Promise<ContractTransaction>
  }

export const trySubmitBid = async (
  options?: SubmittedBidOptions
): Promise<TrySubmitBidReturn> => {
  const { values, txPromise } = await same(options)

  let tx: ContractTransaction | undefined
  let bidId: BN | undefined
  try {
    tx = await txPromise
    bidId = await getBidId(tx)
  } catch (err) {}

  return {
    ...values,
    bidId,
    txPromise,
    tx,
  }
}

const getBidId = async (tx: ContractTransaction): Promise<BN | undefined> => {
  // Wait for the transaction to be mined and perform extra actions with return
  const receipt = await tx.wait()
  const event = receipt.events?.find((evt) => evt.event === 'SubmittedBid')
  return event?.args?.[0]
}

export const submittedBid = deployments.createFixture<
  SubmittedBidReturn,
  SubmittedBidOptions
>(async (hre, options) => await submitBid(options), 'submitted-bid')
