"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryOffer = void 0;
const root_cid_1 = require("./root-cid");
const serializable_object_1 = require("./serializable-object");
const retrieval_peer_1 = require("./retrieval-peer");
const address_1 = require("./address");
class QueryOffer extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.err = super.initializeValue(this.config.err, options);
        this.root = super.initializeValue(this.config.root, options);
        this.piece = super.initializeValue(this.config.piece, options);
        this.size = super.initializeValue(this.config.size, options);
        this.minPrice = super.initializeValue(this.config.minPrice, options);
        this.unsealPrice = super.initializeValue(this.config.unsealPrice, options);
        this.paymentInterval = super.initializeValue(this.config.paymentInterval, options);
        this.paymentIntervalIncrease = super.initializeValue(this.config.paymentIntervalIncrease, options);
        this.miner = super.initializeValue(this.config.miner, options);
        this.minerPeer = super.initializeValue(this.config.minerPeer, options);
    }
    get config() {
        return {
            err: {
                deserializedName: "err",
                serializedName: "Err",
                defaultValue: ""
            },
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
            minPrice: {
                deserializedName: "minPrice",
                serializedName: "MinPrice",
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
exports.QueryOffer = QueryOffer;
//# sourceMappingURL=query-offer.js.map