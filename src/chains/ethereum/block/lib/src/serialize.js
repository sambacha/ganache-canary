"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serialize = void 0;
const rlp_1 = require("@ganache/rlp");
const utils_1 = require("@ganache/utils");
function serialize(raw) {
    const serializedStart = rlp_1.encodeRange(raw, 0, 3);
    const serializedLength = serializedStart.length;
    const ethereumRawBlockSize = rlp_1.encodeLength(serializedLength, 192).length;
    const size = ethereumRawBlockSize + serializedLength;
    const middle = rlp_1.encodeRange(raw, 3, 2);
    const ending = rlp_1.encode(utils_1.uintToBuffer(size));
    return {
        serialized: rlp_1.digest([serializedStart.output, middle.output, [ending]], serializedLength + middle.length + ending.length),
        size
    };
}
exports.serialize = serialize;
//# sourceMappingURL=serialize.js.map