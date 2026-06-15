// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title InsightMarketplace — license verified insights, split payment 40/35/20/5.
contract InsightMarketplace {
    struct Listing { uint256 insightId; address submitter; address computePool; address dataPool; bool licensed; }
    Listing[] public listings;
    address public protocol;

    event Listed(uint256 indexed id, uint256 insightId);
    event Licensed(uint256 indexed id, address licensee, uint256 amount);

    constructor(address _protocol) { protocol = _protocol; }

    function list(uint256 insightId, address submitter, address computePool, address dataPool) external returns (uint256 id) {
        id = listings.length;
        listings.push(Listing(insightId, submitter, computePool, dataPool, false));
        emit Listed(id, insightId);
    }

    function license(uint256 id) external payable {
        Listing storage l = listings[id];
        require(!l.licensed, "licensed");
        require(msg.value > 0, "no payment");
        l.licensed = true;
        uint256 amt = msg.value;
        _pay(l.submitter, (amt * 40) / 100);
        _pay(l.computePool, (amt * 35) / 100);
        _pay(l.dataPool, (amt * 20) / 100);
        _pay(protocol, (amt * 5) / 100);           // protocol fee → buyback/burn off-chain
        emit Licensed(id, msg.sender, amt);
    }

    function _pay(address to, uint256 v) private {
        if (to != address(0) && v > 0) { (bool ok, ) = payable(to).call{value: v}(""); require(ok, "pay fail"); }
    }

    function listingCount() external view returns (uint256) { return listings.length; }
}
