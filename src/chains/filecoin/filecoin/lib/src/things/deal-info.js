"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealInfo = void 0;
const root_cid_1 = require("./root-cid");
const storage_deal_status_1 = require("../types/storage-deal-status");
const serializable_object_1 = require("./serializable-object");
const storage_market_data_ref_1 = require("./storage-market-data-ref");
const channel_id_1 = require("./channel-id");
const data_transfer_channel_1 = require("./data-transfer-channel");
const address_1 = require("./address");
class DealInfo extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.proposalCid = super.initializeValue(this.config.proposalCid, options);
        this.state = super.initializeValue(this.config.state, options);
        this.message = super.initializeValue(this.config.message, options);
        this.provider = super.initializeValue(this.config.provider, options);
        this.dataRef = super.initializeValue(this.config.dataRef, options);
        this.pieceCid = super.initializeValue(this.config.pieceCid, options);
        this.size = super.initializeValue(this.config.size, options);
        this.pricePerEpoch = super.initializeValue(this.config.pricePerEpoch, options);
        this.duration = super.initializeValue(this.config.duration, options);
        this.dealId = super.initializeValue(this.config.dealId, options);
        this.creationTime = super.initializeValue(this.config.creationTime, options);
        this.verified = super.initializeValue(this.config.verified, options);
        this.transferChannelId = super.initializeValue(this.config.transferChannelId, options);
        this.dataTransfer = super.initializeValue(this.config.dataTransfer, options);
    }
    get config() {
        return {
            proposalCid: {
                deserializedName: "proposalCid",
                serializedName: "ProposalCid",
                defaultValue: options => new root_cid_1.RootCID(options)
            },
            state: {
                deserializedName: "state",
                serializedName: "State",
                defaultValue: storage_deal_status_1.StorageDealStatus.Unknown
            },
            message: {
                deserializedName: "message",
                serializedName: "Message",
                defaultValue: ""
            },
            provider: {
                deserializedName: "provider",
                serializedName: "Provider",
                defaultValue: literal => literal ? new address_1.Address(literal) : address_1.Address.fromId(0, false, true)
            },
            dataRef: {
                deserializedName: "dataRef",
                serializedName: "DataRef",
                defaultValue: options => new storage_market_data_ref_1.StorageMarketDataRef(options)
            },
            pieceCid: {
                deserializedName: "pieceCid",
                serializedName: "PieceCID",
                defaultValue: options => (options ? new root_cid_1.RootCID(options) : null)
            },
            size: {
                deserializedName: "size",
                serializedName: "Size",
                defaultValue: 0
            },
            pricePerEpoch: {
                deserializedName: "pricePerEpoch",
                serializedName: "PricePerEpoch",
                defaultValue: literal => (literal ? BigInt(literal) : 0n)
            },
            duration: {
                deserializedName: "duration",
                serializedName: "Duration",
                defaultValue: 0
            },
            dealId: {
                deserializedName: "dealId",
                serializedName: "DealID",
                defaultValue: 0
            },
            creationTime: {
                deserializedName: "creationTime",
                serializedName: "CreationTime",
                defaultValue: new Date()
            },
            verified: {
                deserializedName: "verified",
                serializedName: "Verified",
                defaultValue: false
            },
            transferChannelId: {
                deserializedName: "transferChannelId",
                serializedName: "TransferChannelID",
                defaultValue: options => new channel_id_1.ChannelID(options)
            },
            dataTransfer: {
                deserializedName: "dataTransfer",
                serializedName: "DataTransfer",
                defaultValue: options => new data_transfer_channel_1.DataTransferChannel(options)
            }
        };
    }
    advanceState() {
        this.state = storage_deal_status_1.nextSuccessfulState[this.state];
    }
}
exports.DealInfo = DealInfo;
//# sourceMappingURL=deal-info.js.map