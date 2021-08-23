"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CID = void 0;
const serializable_literal_1 = require("./serializable-literal");
const borc_1 = __importDefault(require("borc"));
const cids_1 = __importDefault(require("cids"));
const multihashing_1 = __importDefault(require("multihashing"));
const multicodec_1 = __importDefault(require("multicodec"));
class CID extends serializable_literal_1.SerializableLiteral {
    get config() {
        return {};
    }
    // Note: This does not (yet) check for cryptographic validity!
    static isValid(value) {
        return value.length >= 59 && value.indexOf("ba") == 0;
    }
    static nullCID() {
        const nilCbor = borc_1.default.encode(0); // using null returns a not-nill cbor
        const multihash = multihashing_1.default(nilCbor, "blake2b-256");
        const rawCid = new cids_1.default(1, multicodec_1.default.print[multicodec_1.default.DAG_CBOR], multihash);
        return new CID(rawCid.toString());
    }
}
exports.CID = CID;
//# sourceMappingURL=cid.js.map