"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElectionProof = void 0;
const serializable_object_1 = require("./serializable-object");
class ElectionProof extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.winCount = super.initializeValue(this.config.winCount, options);
        this.vrfProof = super.initializeValue(this.config.vrfProof, options);
    }
    get config() {
        return {
            winCount: {
                deserializedName: "winCount",
                serializedName: "WinCount",
                defaultValue: 1
            },
            vrfProof: {
                deserializedName: "vrfProof",
                serializedName: "VRFProof",
                defaultValue: literal => typeof literal !== "undefined"
                    ? Buffer.from(literal, "base64")
                    : Buffer.from([0])
            }
        };
    }
}
exports.ElectionProof = ElectionProof;
//# sourceMappingURL=election-proof.js.map