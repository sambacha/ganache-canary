"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoStProof = void 0;
const serializable_object_1 = require("./serializable-object");
class PoStProof extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.postProof = super.initializeValue(this.config.postProof, options);
        this.proofBytes = super.initializeValue(this.config.proofBytes, options);
    }
    get config() {
        return {
            postProof: {
                deserializedName: "postProof",
                serializedName: "PoStProof",
                defaultValue: 0
            },
            proofBytes: {
                deserializedName: "proofBytes",
                serializedName: "ProofBytes",
                defaultValue: literal => typeof literal !== "undefined"
                    ? Buffer.from(literal, "base64")
                    : Buffer.from([0])
            }
        };
    }
}
exports.PoStProof = PoStProof;
//# sourceMappingURL=post-proof.js.map