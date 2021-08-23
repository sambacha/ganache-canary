"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerClaim = void 0;
const serializable_object_1 = require("./serializable-object");
class PowerClaim extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.rawBytePower = super.initializeValue(this.config.rawBytePower, options);
        this.qualityAdjPower = super.initializeValue(this.config.qualityAdjPower, options);
    }
    get config() {
        return {
            rawBytePower: {
                deserializedName: "rawBytePower",
                serializedName: "RawBytePower",
                defaultValue: literal => (literal ? BigInt(literal) : 1n)
            },
            qualityAdjPower: {
                deserializedName: "qualityAdjPower",
                serializedName: "QualityAdjPower",
                defaultValue: literal => (literal ? BigInt(literal) : 1n)
            }
        };
    }
}
exports.PowerClaim = PowerClaim;
//# sourceMappingURL=power-claim.js.map