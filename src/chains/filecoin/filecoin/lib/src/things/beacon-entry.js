"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BeaconEntry = void 0;
const serializable_object_1 = require("./serializable-object");
class BeaconEntry extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.round = super.initializeValue(this.config.round, options);
        this.data = super.initializeValue(this.config.data, options);
    }
    get config() {
        return {
            round: {
                deserializedName: "round",
                serializedName: "Round",
                defaultValue: 0
            },
            data: {
                deserializedName: "data",
                serializedName: "Data",
                defaultValue: literal => typeof literal !== "undefined"
                    ? Buffer.from(literal, "base64")
                    : Buffer.from([0])
            }
        };
    }
}
exports.BeaconEntry = BeaconEntry;
//# sourceMappingURL=beacon-entry.js.map