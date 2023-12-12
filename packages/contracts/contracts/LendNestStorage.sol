pragma solidity >=0.8.0 <0.9.0;
// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/*

    THIS IS ONLY USED FOR SUBGRAPH 
    

*/

contract LendNestV0Storage {
    enum BidState {
        NONEXISTENT,
        PENDING,
        CANCELLED,
        ACCEPTED,
        PAID,
        LIQUIDATED,
        CLOSED
    }

    /**
     * @notice Represents a total amount for a payment.
     * @param principal Amount that counts towards the principal.
     * @param interest  Amount that counts toward interest.
     */
    struct Payment {
        uint256 principal;
        uint256 interest;
    }

    /**
     * @notice Details about the loan.
     * @param lendingToken The token address for the loan.
     * @param principal The amount of tokens initially lent out.
     * @param totalRepaid Payment struct that represents the total principal and interest amount repaid.
     * @param timestamp Timestamp, in seconds, of when the bid was submitted by the borrower.
     * @param acceptedTimestamp Timestamp, in seconds, of when the bid was accepted by the lender.
     * @param lastRepaidTimestamp Timestamp, in seconds, of when the last payment was made
     * @param loanDuration The duration of the loan.
     */
    struct LoanDetails {
        ERC20 lendingToken;
        uint256 principal;
        Payment totalRepaid;
        uint32 timestamp;
        uint32 acceptedTimestamp;
        uint32 lastRepaidTimestamp;
        uint32 loanDuration;
    }

    /**
     * @notice Details about a loan request.
     * @param borrower Account address who is requesting a loan.
     * @param receiver Account address who will receive the loan amount.
     * @param lender Account address who accepted and funded the loan request.
     * @param marketplaceId ID of the marketplace the bid was submitted to.
     * @param metadataURI ID of off chain metadata to find additional information of the loan request.
     * @param loanDetails Struct of the specific loan details.
     * @param terms Struct of the loan request terms.
     * @param state Represents the current state of the loan.
     */
    struct Bid0 {
        address borrower;
        address receiver;
        address _lender; // DEPRECATED
        uint256 marketplaceId;
        bytes32 _metadataURI; // DEPRECATED
        LoanDetails loanDetails;
        Terms terms;
        BidState state;
    }

    /**
     * @notice Information on the terms of a loan request
     * @param paymentCycleAmount Value of tokens expected to be repaid every payment cycle.
     * @param paymentCycle Duration, in seconds, of how often a payment must be made.
     * @param APR Annual percentage rating to be applied on repayments. (10000 == 100%)
     */
    struct Terms {
        uint256 paymentCycleAmount;
        uint32 paymentCycle;
        uint16 APR;
    }

    // Mapping of bidId to bid information.
    mapping(uint256 => Bid0) public bids;
}
