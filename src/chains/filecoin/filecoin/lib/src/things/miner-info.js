"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinerInfo = void 0;
const serializable_object_1 = require("./serializable-object");
const registered_seal_proof_1 = require("../types/registered-seal-proof");
const address_1 = require("./address");
class MinerInfo extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.owner = super.initializeValue(this.config.owner, options);
        this.worker = super.initializeValue(this.config.worker, options);
        this.newWorker = super.initializeValue(this.config.newWorker, options);
        this.controlAddresses = super.initializeValue(this.config.controlAddresses, options);
        this.workerChangeEpoch = super.initializeValue(this.config.workerChangeEpoch, options);
        this.peerId = super.initializeValue(this.config.peerId, options);
        this.multiaddrs = super.initializeValue(this.config.multiaddrs, options);
        this.sealProofType = super.initializeValue(this.config.sealProofType, options);
        this.sectorSize = super.initializeValue(this.config.sectorSize, options);
        this.windowPoStPartitionSectors = super.initializeValue(this.config.windowPoStPartitionSectors, options);
        this.consensusFaultElapsed = super.initializeValue(this.config.consensusFaultElapsed, options);
    }
    get config() {
        return {
            owner: {
                deserializedName: "owner",
                serializedName: "Owner",
                defaultValue: literal => literal ? new address_1.Address(literal) : address_1.Address.fromId(0, false, true)
            },
            worker: {
                deserializedName: "worker",
                serializedName: "Worker",
                defaultValue: literal => literal ? new address_1.Address(literal) : address_1.Address.fromId(0, false, true)
            },
            newWorker: {
                deserializedName: "newWorker",
                serializedName: "NewWorker",
                defaultValue: literal => literal ? new address_1.Address(literal) : address_1.Address.fromId(0, false, true)
            },
            controlAddresses: {
                deserializedName: "controlAddresses",
                serializedName: "ControlAddresses",
                defaultValue: []
            },
            workerChangeEpoch: {
                deserializedName: "workerChangeEpoch",
                serializedName: "WorkerChangeEpoch",
                defaultValue: config => (typeof config !== "undefined" ? config : -1)
            },
            peerId: {
                deserializedName: "peerId",
                serializedName: "PeerId",
                defaultValue: "0" // defaulting this to 0 as we don't have any p2p technology in Ganache
            },
            multiaddrs: {
                deserializedName: "multiaddrs",
                serializedName: "Multiaddrs",
                defaultValue: []
            },
            sealProofType: {
                deserializedName: "sealProofType",
                serializedName: "SealProofType",
                defaultValue: config => typeof config !== "undefined"
                    ? config
                    : registered_seal_proof_1.RegisteredSealProof.StackedDrg2KiBV1_1
            },
            sectorSize: {
                deserializedName: "sectorSize",
                serializedName: "SectorSize",
                defaultValue: 2048 // sectors/sector sizes don't really matter in Ganache; defaulting to 2 KiB (lotus-devnet default)
            },
            windowPoStPartitionSectors: {
                deserializedName: "windowPoStPartitionSectors",
                serializedName: "WindowPoStPartitionSectors",
                defaultValue: config => (typeof config !== "undefined" ? config : 0)
            },
            consensusFaultElapsed: {
                deserializedName: "consensusFaultElapsed",
                serializedName: "ConsensusFaultElapsed",
                defaultValue: config => (typeof config !== "undefined" ? config : -1)
            }
        };
    }
}
exports.MinerInfo = MinerInfo;
//# sourceMappingURL=miner-info.js.map