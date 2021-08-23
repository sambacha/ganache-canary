"use strict";
// Note that the runtime number values of these enums match
// *exactly* the number values of the same states found at
// go-fil-markets/storagemarket/dealstatus.go (https://git.io/JtJAS)
// **DO NOT TRUST** other sources (i.e. lotus/lotuspond/front/src/Client.js
// or js-lotus-client-workshop/src/08-deals/deal-list.js)
// Don't reorganize unless you know what you're doing.
Object.defineProperty(exports, "__esModule", { value: true });
exports.dealIsInProcess = exports.nextSuccessfulState = exports.terminalStates = exports.StorageDealStatus = void 0;
// Updated to v1.1.1 (https://github.com/filecoin-project/go-fil-markets/blob/v1.1.1/storagemarket/dealstatus.go)
var StorageDealStatus;
(function (StorageDealStatus) {
    // Unknown means the current status of a deal is undefined
    StorageDealStatus[StorageDealStatus["Unknown"] = 0] = "Unknown";
    // ProposalNotFound is a status returned in responses when the deal itself cannot
    // be located
    StorageDealStatus[StorageDealStatus["ProposalNotFound"] = 1] = "ProposalNotFound";
    // ProposalRejected is returned by a StorageProvider when it chooses not to accept
    // a DealProposal
    StorageDealStatus[StorageDealStatus["ProposalRejected"] = 2] = "ProposalRejected";
    // ProposalAccepted indicates an intent to accept a storage deal proposal
    StorageDealStatus[StorageDealStatus["ProposalAccepted"] = 3] = "ProposalAccepted";
    // Staged means a deal has been published and data is ready to be put into a sector
    StorageDealStatus[StorageDealStatus["Staged"] = 4] = "Staged";
    // Sealing means a deal is in a sector that is being sealed
    StorageDealStatus[StorageDealStatus["Sealing"] = 5] = "Sealing";
    // Finalizing means a deal is in a sealed sector and we're doing final
    // housekeeping before marking it active
    StorageDealStatus[StorageDealStatus["Finalizing"] = 6] = "Finalizing";
    // Active means a deal is in a sealed sector and the miner is proving the data
    // for the deal
    StorageDealStatus[StorageDealStatus["Active"] = 7] = "Active";
    // Expired means a deal has passed its final epoch and is expired
    StorageDealStatus[StorageDealStatus["Expired"] = 8] = "Expired";
    // Slashed means the deal was in a sector that got slashed from failing to prove
    StorageDealStatus[StorageDealStatus["Slashed"] = 9] = "Slashed";
    // Rejecting means the Provider has rejected the deal, and will send a rejection response
    StorageDealStatus[StorageDealStatus["Rejecting"] = 10] = "Rejecting";
    // Failing means something has gone wrong in a deal. Once data is cleaned up the deal will finalize on
    // Error
    StorageDealStatus[StorageDealStatus["Failing"] = 11] = "Failing";
    // FundsReserved means we've deposited funds as necessary to create a deal, ready to move forward
    StorageDealStatus[StorageDealStatus["FundsReserved"] = 12] = "FundsReserved";
    // CheckForAcceptance means the client is waiting for a provider to seal and publish a deal
    StorageDealStatus[StorageDealStatus["CheckForAcceptance"] = 13] = "CheckForAcceptance";
    // Validating means the provider is validating that deal parameters are good for a proposal
    StorageDealStatus[StorageDealStatus["Validating"] = 14] = "Validating";
    // AcceptWait means the provider is running any custom decision logic to decide whether or not to accept the deal
    StorageDealStatus[StorageDealStatus["AcceptWait"] = 15] = "AcceptWait";
    // StartDataTransfer means data transfer is beginning
    StorageDealStatus[StorageDealStatus["StartDataTransfer"] = 16] = "StartDataTransfer";
    // Transferring means data is being sent from the client to the provider via the data transfer module
    StorageDealStatus[StorageDealStatus["Transferring"] = 17] = "Transferring";
    // WaitingForData indicates either a manual transfer
    // or that the provider has not received a data transfer request from the client
    StorageDealStatus[StorageDealStatus["WaitingForData"] = 18] = "WaitingForData";
    // VerifyData means data has been transferred and we are attempting to verify it against the PieceCID
    StorageDealStatus[StorageDealStatus["VerifyData"] = 19] = "VerifyData";
    // ReserveProviderFunds means that provider is making sure it has adequate funds for the deal in the StorageMarketActor
    StorageDealStatus[StorageDealStatus["ReserveProviderFunds"] = 20] = "ReserveProviderFunds";
    // ReserveClientFunds means that client is making sure it has adequate funds for the deal in the StorageMarketActor
    StorageDealStatus[StorageDealStatus["ReserveClientFunds"] = 21] = "ReserveClientFunds";
    // ProviderFunding means that the provider has deposited funds in the StorageMarketActor and it is waiting
    // to see the funds appear in its balance
    StorageDealStatus[StorageDealStatus["ProviderFunding"] = 22] = "ProviderFunding";
    // ClientFunding means that the client has deposited funds in the StorageMarketActor and it is waiting
    // to see the funds appear in its balance
    StorageDealStatus[StorageDealStatus["ClientFunding"] = 23] = "ClientFunding";
    // Publish means the deal is ready to be published on chain
    StorageDealStatus[StorageDealStatus["Publish"] = 24] = "Publish";
    // Publishing means the deal has been published but we are waiting for it to appear on chain
    StorageDealStatus[StorageDealStatus["Publishing"] = 25] = "Publishing";
    // Error means the deal has failed due to an error, and no further updates will occur
    StorageDealStatus[StorageDealStatus["Error"] = 26] = "Error";
    // ProviderTransferAwaitRestart means the provider has restarted while data
    // was being transferred from client to provider, and will wait for the client to
    // resume the transfer
    StorageDealStatus[StorageDealStatus["ProviderTransferAwaitRestart"] = 27] = "ProviderTransferAwaitRestart";
    // ClientTransferRestart means a storage deal data transfer from client to provider will be restarted
    // by the client
    StorageDealStatus[StorageDealStatus["ClientTransferRestart"] = 28] = "ClientTransferRestart";
    // AwaitingPreCommit means a deal is ready and must be pre-committed
    StorageDealStatus[StorageDealStatus["AwaitingPreCommit"] = 29] = "AwaitingPreCommit";
})(StorageDealStatus = exports.StorageDealStatus || (exports.StorageDealStatus = {}));
exports.terminalStates = [
    StorageDealStatus.ProposalNotFound,
    StorageDealStatus.ProposalRejected,
    StorageDealStatus.Error,
    StorageDealStatus.Expired
];
exports.nextSuccessfulState = [
    StorageDealStatus.Validating,
    StorageDealStatus.Staged,
    StorageDealStatus.ReserveProviderFunds,
    StorageDealStatus.ReserveClientFunds,
    StorageDealStatus.FundsReserved,
    StorageDealStatus.ProviderFunding,
    StorageDealStatus.ClientFunding,
    StorageDealStatus.Publish,
    StorageDealStatus.Publishing,
    StorageDealStatus.Transferring,
    StorageDealStatus.Sealing,
    StorageDealStatus.Active
].reduce((obj, currentValue, index, array) => {
    // This creates an object linking each state to its next state
    let nextValue;
    if (index + 1 < array.length) {
        nextValue = array[index + 1];
    }
    else {
        nextValue = array[index];
    }
    obj[currentValue] = nextValue;
    return obj;
}, {});
function dealIsInProcess(state) {
    return (state !== StorageDealStatus.Active &&
        typeof exports.nextSuccessfulState[state] !== "undefined");
}
exports.dealIsInProcess = dealIsInProcess;
//# sourceMappingURL=storage-deal-status.js.map