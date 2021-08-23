"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockHeader = void 0;
const ticket_1 = require("./ticket");
const election_proof_1 = require("./election-proof");
const beacon_entry_1 = require("./beacon-entry");
const serializable_object_1 = require("./serializable-object");
const post_proof_1 = require("./post-proof");
const root_cid_1 = require("./root-cid");
const signature_1 = require("./signature");
const address_1 = require("./address");
class BlockHeader extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.miner = super.initializeValue(this.config.miner, options);
        this.ticket = super.initializeValue(this.config.ticket, options);
        this.electionProof = super.initializeValue(this.config.electionProof, options);
        this.beaconEntries = super.initializeValue(this.config.beaconEntries, options);
        this.winPoStProof = super.initializeValue(this.config.winPoStProof, options);
        this.parents = super.initializeValue(this.config.parents, options);
        this.parentWeight = super.initializeValue(this.config.parentWeight, options);
        this.height = super.initializeValue(this.config.height, options);
        this.parentStateRoot = super.initializeValue(this.config.parentStateRoot, options);
        this.parentMessageReceipts = super.initializeValue(this.config.parentMessageReceipts, options);
        this.messages = super.initializeValue(this.config.messages, options);
        this.blsAggregate = super.initializeValue(this.config.blsAggregate, options);
        this.timestamp = super.initializeValue(this.config.timestamp, options);
        this.blockSignature = super.initializeValue(this.config.blockSignature, options);
        this.forkSignaling = super.initializeValue(this.config.forkSignaling, options);
        this.parentBaseFee = super.initializeValue(this.config.parentBaseFee, options);
    }
    get config() {
        return {
            miner: {
                deserializedName: "miner",
                serializedName: "Miner",
                defaultValue: literal => literal ? new address_1.Address(literal) : address_1.Address.fromId(0, false, true)
            },
            ticket: {
                deserializedName: "ticket",
                serializedName: "Ticket",
                defaultValue: options => new ticket_1.Ticket(options)
            },
            electionProof: {
                deserializedName: "electionProof",
                serializedName: "ElectionProof",
                defaultValue: options => new election_proof_1.ElectionProof(options)
            },
            beaconEntries: {
                deserializedName: "beaconEntries",
                serializedName: "BeaconEntries",
                defaultValue: options => options ? options.map(entry => new beacon_entry_1.BeaconEntry(entry)) : []
            },
            winPoStProof: {
                deserializedName: "winPoStProof",
                serializedName: "WinPoStProof",
                defaultValue: options => options ? options.map(proof => new post_proof_1.PoStProof(proof)) : []
            },
            parents: {
                deserializedName: "parents",
                serializedName: "Parents",
                defaultValue: options => options ? options.map(parent => new root_cid_1.RootCID(parent)) : []
            },
            parentWeight: {
                deserializedName: "parentWeight",
                serializedName: "ParentWeight",
                defaultValue: literal => (literal ? BigInt(literal) : 0n)
            },
            height: {
                deserializedName: "height",
                serializedName: "Height",
                defaultValue: 0
            },
            parentStateRoot: {
                deserializedName: "parentStateRoot",
                serializedName: "ParentStateRoot",
                defaultValue: options => new root_cid_1.RootCID(options)
            },
            parentMessageReceipts: {
                deserializedName: "parentMessageReceipts",
                serializedName: "ParentMessageReceipts",
                defaultValue: options => new root_cid_1.RootCID(options)
            },
            messages: {
                deserializedName: "messages",
                serializedName: "Messages",
                defaultValue: options => new root_cid_1.RootCID(options)
            },
            blsAggregate: {
                deserializedName: "blsAggregate",
                serializedName: "BLSAggregate",
                defaultValue: options => new signature_1.Signature(options)
            },
            timestamp: {
                deserializedName: "timestamp",
                serializedName: "Timestamp",
                defaultValue: literal => {
                    return typeof literal !== "undefined"
                        ? literal
                        : new Date().getTime() / 1000;
                }
            },
            blockSignature: {
                deserializedName: "blockSignature",
                serializedName: "BlockSig",
                defaultValue: options => new signature_1.Signature(options)
            },
            forkSignaling: {
                deserializedName: "forkSignaling",
                serializedName: "ForkSignaling",
                defaultValue: 0
            },
            parentBaseFee: {
                deserializedName: "parentBaseFee",
                serializedName: "ParentBaseFee",
                defaultValue: literal => (literal ? BigInt(literal) : 0n)
            }
        };
    }
}
exports.BlockHeader = BlockHeader;
//# sourceMappingURL=block-header.js.map