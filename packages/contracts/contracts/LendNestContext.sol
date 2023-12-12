pragma solidity >=0.8.0 <0.9.0;
// SPDX-License-Identifier: MIT

import "./LendNestV2Storage.sol";
import "./ERC2771ContextUpgradeable.sol";

/**
 * @dev This contract should not use any storage
 */

abstract contract LendNestV2Context is
    ERC2771ContextUpgradeable,
    LendNestV2Storage
{
    using EnumerableSet for EnumerableSet.AddressSet;

    event TrustedMarketForwarderSet(
        uint256 indexed marketId,
        address forwarder,
        address sender
    );
    event MarketForwarderApproved(
        uint256 indexed marketId,
        address indexed forwarder,
        address sender
    );
    event MarketForwarderRenounced(
        uint256 indexed marketId,
        address indexed forwarder,
        address sender
    );

    constructor(address trustedForwarder)
        ERC2771ContextUpgradeable(trustedForwarder)
    {}

    /**
     * @notice Checks if an address is a trusted forwarder contract for a given market.
     * @param _marketId An ID for a lending market.
     * @param _trustedMarketForwarder An address to check if is a trusted forwarder in the given market.
     * @return A boolean indicating the forwarder address is trusted in a market.
     */
    function isTrustedMarketForwarder(
        uint256 _marketId,
        address _trustedMarketForwarder
    ) public view returns (bool) {
        return
            _trustedMarketForwarders[_marketId] == _trustedMarketForwarder ||
            lenderCommitmentForwarder == _trustedMarketForwarder;
    }

    /**
     * @notice Checks if an account has approved a forwarder for a market.
     * @param _marketId An ID for a lending market.
     * @param _forwarder A forwarder contract address.
     * @param _account The address to verify set an approval.
     * @return A boolean indicating if an approval was set.
     */
    function hasApprovedMarketForwarder(
        uint256 _marketId,
        address _forwarder,
        address _account
    ) public view returns (bool) {
        return
            isTrustedMarketForwarder(_marketId, _forwarder) &&
            _approvedForwarderSenders[_forwarder].contains(_account);
    }

    /**
     * @notice Sets a trusted forwarder for a lending market.
     * @notice The caller must owner the market given. See {MarketRegistry}
     * @param _marketId An ID for a lending market.
     * @param _forwarder A forwarder contract address.
     */
    function setTrustedMarketForwarder(uint256 _marketId, address _forwarder)
        external
    {
        require(
            marketRegistry.getMarketOwner(_marketId) == _msgSender(),
            "Caller must be the market owner"
        );
        _trustedMarketForwarders[_marketId] = _forwarder;
        emit TrustedMarketForwarderSet(_marketId, _forwarder, _msgSender());
    }

    /**
     * @notice Approves a forwarder contract to use their address as a sender for a specific market.
     * @notice The forwarder given must be trusted by the market given.
     * @param _marketId An ID for a lending market.
     * @param _forwarder A forwarder contract address.
     */
    function approveMarketForwarder(uint256 _marketId, address _forwarder)
        external
    {
        require(
            isTrustedMarketForwarder(_marketId, _forwarder),
            "Forwarder must be trusted by the market"
        );
        _approvedForwarderSenders[_forwarder].add(_msgSender());
        emit MarketForwarderApproved(_marketId, _forwarder, _msgSender());
    }

    /**
     * @notice Renounces approval of a market forwarder
     * @param _marketId An ID for a lending market.
     * @param _forwarder A forwarder contract address.
     */
    function renounceMarketForwarder(uint256 _marketId, address _forwarder)
        external
    {
        if (_approvedForwarderSenders[_forwarder].contains(_msgSender())) {
            _approvedForwarderSenders[_forwarder].remove(_msgSender());
            emit MarketForwarderRenounced(_marketId, _forwarder, _msgSender());
        }
    }

    /**
     * @notice Retrieves the function caller address by checking the appended calldata if the _actual_ caller is a trusted forwarder.
     * @param _marketId An ID for a lending market.
     * @return sender The address to use as the function caller.
     */
    function _msgSenderForMarket(uint256 _marketId)
        internal
        view
        virtual
        returns (address)
    {
        if (
            msg.data.length >= 20 &&
            isTrustedMarketForwarder(_marketId, _msgSender())
        ) {
            address sender;
            assembly {
                sender := shr(96, calldataload(sub(calldatasize(), 20)))
            }
            // Ensure the appended sender address approved the forwarder
            require(
                _approvedForwarderSenders[_msgSender()].contains(sender),
                "Sender must approve market forwarder"
            );
            return sender;
        }

        return _msgSender();
    }

    /**
     * @notice Retrieves the actual function calldata from a trusted forwarder call.
     * @param _marketId An ID for a lending market to verify if the caller is a trusted forwarder.
     * @return calldata The modified bytes array of the function calldata without the appended sender's address.
     */
    function _msgDataForMarket(uint256 _marketId)
        internal
        view
        virtual
        returns (bytes calldata)
    {
        if (isTrustedMarketForwarder(_marketId, _msgSender())) {
            return msg.data[:msg.data.length - 20];
        } else {
            return _msgData();
        }
    }
}