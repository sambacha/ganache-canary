"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetrievalPeer = void 0;
const serializable_object_1 = require("./serializable-object");
const root_cid_1 = require("./root-cid");
const address_1 = require("./address");
class RetrievalPeer extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.address = super.initializeValue(this.config.address, options);
        this.id = super.initializeValue(this.config.id, options);
        this.pieceCID = super.initializeValue(this.config.pieceCID, options);
    }
    get config() {
        return {
            address: {
                deserializedName: "address",
                serializedName: "Address",
                defaultValue: literal => literal ? new address_1.Address(literal) : address_1.Address.fromId(0, false, true)
            },
            id: {
                deserializedName: "id",
                serializedName: "ID",
                defaultValue: "0"
            },
            pieceCID: {
                deserializedName: "pieceCID",
                serializedName: "PieceCID",
                defaultValue: options => new root_cid_1.RootCID(options)
            }
        };
    }
}
exports.RetrievalPeer = RetrievalPeer;
//# sourceMappingURL=retrieval-peer.js.map