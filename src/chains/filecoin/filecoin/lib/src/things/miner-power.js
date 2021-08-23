"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinerPower = void 0;
const serializable_object_1 = require("./serializable-object");
const power_claim_1 = require("./power-claim");
class MinerPower extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.minerPower = super.initializeValue(this.config.minerPower, options);
        this.totalPower = super.initializeValue(this.config.totalPower, options);
        this.hasMinPower = super.initializeValue(this.config.hasMinPower, options);
    }
    get config() {
        return {
            minerPower: {
                deserializedName: "minerPower",
                serializedName: "MinerPower",
                defaultValue: options => new power_claim_1.PowerClaim(options)
            },
            totalPower: {
                deserializedName: "totalPower",
                serializedName: "TotalPower",
                defaultValue: options => new power_claim_1.PowerClaim(options)
            },
            hasMinPower: {
                deserializedName: "hasMinPower",
                serializedName: "HasMinPower",
                defaultValue: false
            }
        };
    }
}
exports.MinerPower = MinerPower;
//# sourceMappingURL=miner-power.js.map