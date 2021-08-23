"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetrievalOrder = void 0;
const root_cid_1 = require("./root-cid");
const serializable_object_1 = require("./serializable-object");
const retrieval_peer_1 = require("./retrieval-peer");
const address_1 = require("./address");
class RetrievalOrder extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.root = super.initializeValue(this.config.root, options);
        this.piece = super.initializeValue(this.config.piece, options);
        this.size = super.initializeValue(this.config.size, options);
        this.total = super.initializeValue(this.config.total, options);
        this.unsealPrice = super.initializeValue(this.config.unsealPrice, options);
        this.paymentInterval = super.initializeValue(this.config.paymentInterval, options);
        this.paymentIntervalIncrease = super.initializeValue(this.config.paymentIntervalIncrease, options);
        this.client = super.initializeValue(this.config.client, options);
        this.miner = super.initializeValue(this.config.miner, options);
        this.minerPeer = super.initializeValue(this.config.minerPeer, options);
    }
    get config() {
        return {
            root: {
                deserializedName: "root",
                serializedName: "Root",
                defaultValue: options => new root_cid_1.RootCID(options)
            },
            piece: {
                deserializedName: "piece",
                serializedName: "Piece",
                defaultValue: options => new root_cid_1.RootCID(options)
            },
            size: {
                deserializedName: "size",
                serializedName: "Size",
                defaultValue: 0
            },
            total: {
                deserializedName: "total",
                serializedName: "Total",
                defaultValue: literal => (literal ? BigInt(literal) : 0n)
            },
            unsealPrice: {
                deserializedName: "unsealPrice",
                serializedName: "UnsealPrice",
                defaultValue: literal => (literal ? BigInt(literal) : 0n)
            },
            paymentInterval: {
                deserializedName: "paymentInterval",
                serializedName: "PaymentInterval",
                defaultValue: 1048576
            },
            paymentIntervalIncrease: {
                deserializedName: "paymentIntervalIncrease",
                serializedName: "PaymentIntervalIncrease",
                defaultValue: 1048576
            },
            client: {
                deserializedName: "client",
                serializedName: "Client",
                defaultValue: literal => literal ? new address_1.Address(literal) : address_1.Address.fromId(0)
            },
            miner: {
                deserializedName: "miner",
                serializedName: "Miner",
                defaultValue: literal => literal ? new address_1.Address(literal) : address_1.Address.fromId(0, false, true)
            },
            minerPeer: {
                deserializedName: "minerPeer",
                serializedName: "MinerPeer",
                defaultValue: options => new retrieval_peer_1.RetrievalPeer(options)
            }
        };
    }
}
exports.RetrievalOrder = RetrievalOrder;
//# sourceMappingURL=retrieval-order.js.map