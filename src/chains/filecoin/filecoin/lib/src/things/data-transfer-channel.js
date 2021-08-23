"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTransferChannel = void 0;
const root_cid_1 = require("./root-cid");
const serializable_object_1 = require("./serializable-object");
class DataTransferChannel extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.transferId = super.initializeValue(this.config.transferId, options);
        this.status = super.initializeValue(this.config.status, options);
        this.baseCID = super.initializeValue(this.config.baseCID, options);
        this.isInitiator = super.initializeValue(this.config.isInitiator, options);
        this.isSender = super.initializeValue(this.config.isSender, options);
        this.voucher = super.initializeValue(this.config.voucher, options);
        this.message = super.initializeValue(this.config.message, options);
        this.otherPeer = super.initializeValue(this.config.otherPeer, options);
        this.transferred = super.initializeValue(this.config.transferred, options);
    }
    get config() {
        return {
            transferId: {
                deserializedName: "transferId",
                serializedName: "TransferID",
                defaultValue: 0
            },
            status: {
                deserializedName: "status",
                serializedName: "Status",
                defaultValue: 0
            },
            baseCID: {
                deserializedName: "baseCID",
                serializedName: "BaseCID",
                defaultValue: options => options ? new root_cid_1.RootCID(options) : new root_cid_1.RootCID({ "/": "Unknown" })
            },
            isInitiator: {
                deserializedName: "isInitiator",
                serializedName: "IsInitiator",
                defaultValue: false
            },
            isSender: {
                deserializedName: "isSender",
                serializedName: "IsSender",
                defaultValue: false
            },
            voucher: {
                deserializedName: "voucher",
                serializedName: "Voucher",
                defaultValue: ""
            },
            message: {
                deserializedName: "message",
                serializedName: "Message",
                defaultValue: ""
            },
            otherPeer: {
                deserializedName: "otherPeer",
                serializedName: "OtherPeer",
                defaultValue: ""
            },
            transferred: {
                deserializedName: "transferred",
                serializedName: "Transferred",
                defaultValue: 0
            }
        };
    }
}
exports.DataTransferChannel = DataTransferChannel;
//# sourceMappingURL=data-transfer-channel.js.map