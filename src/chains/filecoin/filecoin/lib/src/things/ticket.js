"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ticket = void 0;
const serializable_object_1 = require("./serializable-object");
class Ticket extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.vrfProof = super.initializeValue(this.config.vrfProof, options);
    }
    get config() {
        return {
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
exports.Ticket = Ticket;
//# sourceMappingURL=ticket.js.map