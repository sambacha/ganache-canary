"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageMarketDataRef = void 0;
const root_cid_1 = require("./root-cid");
const serializable_object_1 = require("./serializable-object");
class StorageMarketDataRef extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.transferType = super.initializeValue(this.config.transferType, options);
        this.root = super.initializeValue(this.config.root, options);
        this.pieceCid = super.initializeValue(this.config.pieceCid, options);
        this.pieceSize = super.initializeValue(this.config.pieceSize, options);
    }
    get config() {
        return {
            transferType: {
                deserializedName: "transferType",
                serializedName: "TransferType",
                defaultValue: "graphsync"
            },
            root: {
                deserializedName: "root",
                serializedName: "Root",
                defaultValue: options => new root_cid_1.RootCID(options)
            },
            pieceCid: {
                deserializedName: "pieceCid",
                serializedName: "PieceCid",
                defaultValue: options => new root_cid_1.RootCID(options || {
                    "/": "Piece CIDs are not supported in Ganache"
                })
            },
            pieceSize: {
                deserializedName: "pieceSize",
                serializedName: "PieceSize",
                defaultValue: 0
            }
        };
    }
}
exports.StorageMarketDataRef = StorageMarketDataRef;
//# sourceMappingURL=storage-market-data-ref.js.map