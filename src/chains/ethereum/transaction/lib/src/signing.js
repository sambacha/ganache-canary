"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeIntrinsics = exports.computeHash = exports.computeFromAddress = exports.publicKeyConvert = exports.ecdaRecover = exports.isValidSigRecovery = void 0;
const utils_1 = require("@ganache/utils");
const rlp_1 = require("@ganache/rlp");
const ethereum_address_1 = require("@ganache/ethereum-address");
let secp256k1;
try {
    secp256k1 = require("node-gyp-build")(__dirname);
}
catch (err) {
    secp256k1 = require("secp256k1/lib/elliptic");
}
const intToBuffer = (value) => value === 0 ? utils_1.BUFFER_EMPTY : utils_1.uintToBuffer(value);
/**
 * Copies `length` bytes from `source` to the `target`, filling remaining
 * bytes beyond `length - source.length` with `0`. Fills to the left.
 *
 * ```typescript
 * const source = Buffer.from([1, 2, 3]);
 * const target = Buffer.from([9, 9, 9, 9, 9, 9]);
 * copyOrFill(source, target, 1, 4);
 * // target.equals(Buffer.from([9, 0, 1, 2, 3, 9]));
 * //                               ^  ^  ^  ^
 * ```
 *
 * @param source A Buffer to copy from.
 * @param target A Buffer to copy into.
 * @param targetStart The offset within `target` at which to begin writing.
 * @param length The amount of bytes to copy or fill into the `target`.
 */
function copyOrFill(source, target, targetStart, length) {
    if (source.byteLength > length)
        throw new Error("Invalid signature");
    // first, copy zeroes
    const numZeroes = length - source.byteLength;
    const endZeroes = targetStart + numZeroes;
    let i = targetStart;
    for (; i < endZeroes; i++) {
        target[i] = 0;
    }
    // then copy the source into the target:
    let end = targetStart + length;
    const sourceOffset = targetStart + numZeroes;
    for (; i < end; i++) {
        target[i] = source[i - sourceOffset];
    }
}
const isValidSigRecovery = (recovery) => {
    return recovery === 1 || recovery === 0;
};
exports.isValidSigRecovery = isValidSigRecovery;
/**
 *
 * @param sharedBuffer A Buffer, where bytes 0 - 97 are to be used by this function
 * @param r
 * @param s
 * @param msgHash
 * @param recovery
 */
const ecdaRecover = (partialRlp, sharedBuffer, v, chainId, raw) => {
    let data;
    let recid;
    const eip155V = chainId * 2 + 35;
    const isEip155 = v === eip155V || v === eip155V + 1;
    if (isEip155) {
        const chainBuf = intToBuffer(chainId);
        const extras = [chainBuf, utils_1.BUFFER_EMPTY, utils_1.BUFFER_EMPTY];
        const epilogue = rlp_1.encodeRange(extras, 0, 3);
        data = rlp_1.digest([partialRlp.output, epilogue.output], partialRlp.length + epilogue.length);
        recid = v - eip155V;
    }
    else {
        data = rlp_1.digest([partialRlp.output], partialRlp.length);
        recid = v - 27;
    }
    if (!exports.isValidSigRecovery(recid)) {
        throw new Error("Invalid signature v value");
    }
    const message = utils_1.keccak(data);
    const signature = sharedBuffer.slice(0, 64);
    copyOrFill(raw[7], signature, 0, 32);
    copyOrFill(raw[8], signature, 32, 32);
    const output = sharedBuffer.slice(0, 33);
    const success = secp256k1.ecdsaRecover(output, signature, recid, message);
    if (success !== 0) {
        throw new Error("Invalid Signature");
    }
    return output;
};
exports.ecdaRecover = ecdaRecover;
/**
 *
 * @param sharedBuffer A Buffer, bytes 0 - 65 will be overwritten
 * @param senderPubKey
 */
const publicKeyConvert = (sharedBuffer, senderPubKey) => {
    const publicKey = sharedBuffer.slice(0, 65);
    const result = secp256k1.publicKeyConvert(publicKey, senderPubKey);
    if (result !== 0) {
        throw new Error("Invalid Signature");
    }
    return publicKey;
};
exports.publicKeyConvert = publicKeyConvert;
/**
 * A Buffer that can be reused by `computeFromAddress`.
 */
const SHARED_BUFFER = Buffer.allocUnsafe(65);
const computeFromAddress = (partialRlp, v, raw, chainId) => {
    const senderPubKey = exports.ecdaRecover(partialRlp, SHARED_BUFFER, v, chainId, raw);
    const publicKey = exports.publicKeyConvert(SHARED_BUFFER, senderPubKey);
    return ethereum_address_1.Address.from(utils_1.keccak(publicKey.slice(1)).slice(-20));
};
exports.computeFromAddress = computeFromAddress;
const computeHash = (raw) => {
    return utils_1.Data.from(utils_1.keccak(rlp_1.encode(raw)), 32);
};
exports.computeHash = computeHash;
const computeIntrinsics = (v, raw, chainId) => {
    const encodedData = rlp_1.encodeRange(raw, 0, 6);
    const encodedSignature = rlp_1.encodeRange(raw, 6, 3);
    const serialized = rlp_1.digest([encodedData.output, encodedSignature.output], encodedData.length + encodedSignature.length);
    return {
        from: exports.computeFromAddress(encodedData, v.toNumber(), raw, chainId),
        hash: utils_1.Data.from(utils_1.keccak(serialized), 32),
        serialized,
        encodedData,
        encodedSignature
    };
};
exports.computeIntrinsics = computeIntrinsics;
//# sourceMappingURL=signing.js.map