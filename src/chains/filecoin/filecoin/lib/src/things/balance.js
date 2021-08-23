"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Balance = void 0;
const serializable_literal_1 = require("./serializable-literal");
const bn_js_1 = __importDefault(require("bn.js"));
// The smallest denomination of FIL is an attoFIL (10^-18 FIL)
class Balance extends serializable_literal_1.SerializableLiteral {
    get config() {
        return {
            defaultValue: literal => literal ? BigInt(literal) : Balance.FILToLowestDenomination(100)
        };
    }
    sub(val) {
        this.value -= BigInt(val);
    }
    add(val) {
        this.value += BigInt(val);
    }
    toFIL() {
        return Balance.LowestDenominationToFIL(this.value);
    }
    static FILToLowestDenomination(fil) {
        return BigInt(fil) * 1000000000000000000n;
    }
    static LowestDenominationToFIL(attoFil) {
        return new bn_js_1.default(attoFil.toString(10))
            .div(new bn_js_1.default(10).pow(new bn_js_1.default(18)))
            .toNumber();
    }
}
exports.Balance = Balance;
//# sourceMappingURL=balance.js.map