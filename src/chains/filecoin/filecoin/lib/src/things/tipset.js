"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tipset = void 0;
const block_header_1 = require("./block-header");
const serializable_object_1 = require("./serializable-object");
const root_cid_1 = require("./root-cid");
class Tipset extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.cids = super.initializeValue(this.config.cids, options);
        this.blocks = super.initializeValue(this.config.blocks, options);
        this.height = super.initializeValue(this.config.height, options);
        // Calculate Cid's if not specified
        if (this.cids.length === 0) {
            for (const block of this.blocks) {
                this.cids.push(new root_cid_1.RootCID({
                    root: block.cid
                }));
            }
        }
    }
    get config() {
        return {
            cids: {
                deserializedName: "cids",
                serializedName: "Cids",
                defaultValue: options => options ? options.map(rootCid => new root_cid_1.RootCID(rootCid)) : []
            },
            blocks: {
                deserializedName: "blocks",
                serializedName: "Blocks",
                defaultValue: options => options ? options.map(block => new block_header_1.BlockHeader(block)) : []
            },
            height: {
                deserializedName: "height",
                serializedName: "Height",
                defaultValue: 0
            }
        };
    }
}
exports.Tipset = Tipset;
//# sourceMappingURL=tipset.js.map