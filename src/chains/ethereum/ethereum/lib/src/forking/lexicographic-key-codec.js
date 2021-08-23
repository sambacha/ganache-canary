"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = exports.encode = void 0;
const utils_1 = require("@ganache/utils");
function encode(parts) {
    const l = parts.length;
    let totalLength = 0;
    const pieces = [];
    for (let i = 0; i < l; i++) {
        const part = parts[i];
        if (part === null) {
            totalLength += 2; // {length of the length} (`1`) + {length} (`0`)
            pieces.push([utils_1.BUFFER_ZERO, utils_1.BUFFER_EMPTY]);
        }
        else {
            const length = part.length;
            const lengthBuffer = utils_1.Quantity.from(length).toBuffer();
            const lengthLength = lengthBuffer.length;
            totalLength += 1 + lengthLength + length;
            pieces.push([lengthBuffer, part]);
        }
    }
    const encoded = Buffer.allocUnsafe(totalLength);
    let offset = 0;
    for (let i = 0; i < l; i++) {
        const [lengthBuffer, part] = pieces[i];
        const lengthLength = lengthBuffer.length;
        encoded[offset++] = lengthLength;
        lengthBuffer.copy(encoded, offset, 0, lengthLength);
        part.copy(encoded, (offset += lengthLength), 0, part.length);
        offset += part.length;
    }
    return encoded;
}
exports.encode = encode;
function decode(encoded) {
    const parts = [];
    for (let i = 0, l = encoded.length; i < l;) {
        const lengthLength = encoded[i++];
        const length = utils_1.Quantity.from(encoded.slice(i, (i += lengthLength))).toNumber();
        parts.push(encoded.slice(i, (i += length)));
    }
    return parts;
}
exports.decode = decode;
//# sourceMappingURL=lexicographic-key-codec.js.map