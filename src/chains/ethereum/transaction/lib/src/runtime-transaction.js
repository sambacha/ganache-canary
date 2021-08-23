"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeTransaction = exports.hasPartialSignature = exports.toValidLengthAddress = void 0;
const ethereum_utils_1 = require("@ganache/ethereum-utils");
const utils_1 = require("@ganache/utils");
const ethereumjs_util_1 = require("ethereumjs-util");
const signing_1 = require("./signing");
const rlp_1 = require("@ganache/rlp");
const base_transaction_1 = require("./base-transaction");
const transaction_receipt_1 = require("./transaction-receipt");
const ethereum_address_1 = require("@ganache/ethereum-address");
const toValidLengthAddress = (address, fieldName) => {
    const buffer = utils_1.Data.from(address).toBuffer();
    if (buffer.byteLength !== ethereum_address_1.Address.ByteLength) {
        throw new Error(`The field ${fieldName} must have byte length of ${ethereum_address_1.Address.ByteLength}`);
    }
    return ethereum_address_1.Address.from(buffer);
};
exports.toValidLengthAddress = toValidLengthAddress;
const hasPartialSignature = (data) => {
    return data["v"] != null || data["r"] != null || data["s"] != null;
};
exports.hasPartialSignature = hasPartialSignature;
const ONE_BUFFER = utils_1.RPCQUANTITY_ONE.toBuffer();
/**
 * A RuntimeTransaction can be changed; its hash is not finalized and it is not
 * yet part of a block.
 */
class RuntimeTransaction extends base_transaction_1.BaseTransaction {
    constructor(data, common) {
        super(common);
        /**
         * used by the miner to mark if this transaction is eligible for reordering or
         * removal
         */
        this.locked = false;
        this.toJSON = () => {
            return {
                hash: this.hash,
                nonce: this.nonce,
                blockHash: null,
                blockNumber: null,
                transactionIndex: null,
                from: this.from,
                to: this.to.isNull() ? null : this.to,
                value: this.value,
                gas: this.gas,
                gasPrice: this.gasPrice,
                input: this.data,
                v: this.v,
                r: this.r,
                s: this.s
            };
        };
        let finalizer;
        this.finalized = new Promise(resolve => {
            finalizer = (...args) => process.nextTick(resolve, ...args);
        });
        this.finalizer = finalizer;
        if (Array.isArray(data)) {
            // handle raw data (sendRawTransaction)
            this.nonce = utils_1.Quantity.from(data[0]);
            this.gasPrice = utils_1.Quantity.from(data[1]);
            this.gas = utils_1.Quantity.from(data[2]);
            this.to = data[3].length == 0 ? utils_1.RPCQUANTITY_EMPTY : ethereum_address_1.Address.from(data[3]);
            this.value = utils_1.Quantity.from(data[4]);
            this.data = utils_1.Data.from(data[5]);
            this.v = utils_1.Quantity.from(data[6]);
            this.r = utils_1.Quantity.from(data[7]);
            this.s = utils_1.Quantity.from(data[8]);
            const { from, serialized, hash, encodedData, encodedSignature } = signing_1.computeIntrinsics(this.v, data, this.common.chainId());
            this.from = from;
            this.raw = data;
            this.serialized = serialized;
            this.hash = hash;
            this.encodedData = encodedData;
            this.encodedSignature = encodedSignature;
        }
        else {
            // handle JSON
            this.nonce = utils_1.Quantity.from(data.nonce, true);
            this.gasPrice = utils_1.Quantity.from(data.gasPrice);
            this.gas = utils_1.Quantity.from(data.gas == null ? data.gasLimit : data.gas);
            this.to =
                data.to == null
                    ? utils_1.RPCQUANTITY_EMPTY
                    : exports.toValidLengthAddress(data.to, "to");
            this.value = utils_1.Quantity.from(data.value);
            this.data = utils_1.Data.from(data.data == null ? data.input : data.data);
            // If we have v, r, or s validate and use them
            if (exports.hasPartialSignature(data)) {
                if (data.v == null || data.r == null || data.s == null) {
                    throw new Error("Transaction signature is incomplete; v, r, and s are required.");
                }
                // if we have a signature the `nonce` field is required
                if (data.nonce == null) {
                    throw new Error("Signed transaction is incomplete; nonce is required.");
                }
                this.v = utils_1.Quantity.from(data.v, true);
                this.r = utils_1.Quantity.from(data.r, true);
                this.s = utils_1.Quantity.from(data.s, true);
                // compute the `hash` and the `from` address
                const raw = [
                    this.nonce.toBuffer(),
                    this.gasPrice.toBuffer(),
                    this.gas.toBuffer(),
                    this.to.toBuffer(),
                    this.value.toBuffer(),
                    this.data.toBuffer(),
                    this.v.toBuffer(),
                    this.r.toBuffer(),
                    this.s.toBuffer()
                ];
                const { from, serialized, hash, encodedData, encodedSignature } = signing_1.computeIntrinsics(this.v, raw, this.common.chainId());
                // if the user specified a `from` address in addition to the  `v`, `r`,
                //  and `s` values, make sure the `from` address matches
                if (data.from !== null) {
                    const userFrom = exports.toValidLengthAddress(data.from, "from");
                    if (!from.toBuffer().equals(userFrom.toBuffer())) {
                        throw new Error("Transaction is signed and contains a `from` field, but the signature doesn't match.");
                    }
                }
                this.from = from;
                this.raw = raw;
                this.serialized = serialized;
                this.hash = hash;
                this.encodedData = encodedData;
                this.encodedSignature = encodedSignature;
            }
            else if (data.from != null) {
                // we don't have a signature yet, so we just need to record the `from`
                // address for now. The TransactionPool will fill in the `hash` and
                // `raw` fields during signing
                this.from = exports.toValidLengthAddress(data.from, "from");
            }
        }
    }
    /**
     * sign a transaction with a given private key, then compute and set the `hash`.
     *
     * @param privateKey - Must be 32 bytes in length
     */
    signAndHash(privateKey) {
        if (this.v != null) {
            throw new Error("Internal Error: RuntimeTransaction `sign` called but transaction has already been signed");
        }
        const chainId = this.common.chainId();
        const raw = [
            this.nonce.toBuffer(),
            this.gasPrice.toBuffer(),
            this.gas.toBuffer(),
            this.to.toBuffer(),
            this.value.toBuffer(),
            this.data.toBuffer(),
            utils_1.Quantity.from(chainId).toBuffer(),
            utils_1.BUFFER_EMPTY,
            utils_1.BUFFER_EMPTY
        ];
        const data = rlp_1.encodeRange(raw, 0, 6);
        const dataLength = data.length;
        const ending = rlp_1.encodeRange(raw, 6, 3);
        const msgHash = utils_1.keccak(rlp_1.digest([data.output, ending.output], dataLength + ending.length));
        const sig = ethereumjs_util_1.ecsign(msgHash, privateKey, chainId);
        this.v = utils_1.Quantity.from(sig.v);
        this.r = utils_1.Quantity.from(sig.r);
        this.s = utils_1.Quantity.from(sig.s);
        raw[6] = this.v.toBuffer();
        raw[7] = this.r.toBuffer();
        raw[8] = this.s.toBuffer();
        this.raw = raw;
        const encodedSignature = rlp_1.encodeRange(raw, 6, 3);
        this.serialized = rlp_1.digest([data.output, encodedSignature.output], dataLength + encodedSignature.length);
        this.hash = utils_1.Data.from(utils_1.keccak(this.serialized));
        this.encodedData = data;
        this.encodedSignature = encodedSignature;
    }
    serializeForDb(blockHash, blockNumber, transactionIndex) {
        // todo(perf):make this work with encodeRange and digest
        const txAndExtraData = [
            this.raw,
            [
                this.from.toBuffer(),
                this.hash.toBuffer(),
                blockHash.toBuffer(),
                blockNumber.toBuffer(),
                transactionIndex.toBuffer()
            ]
        ];
        return rlp_1.encode(txAndExtraData);
    }
    /**
     * Initializes the receipt and logs
     * @param result
     * @returns RLP encoded data for use in a transaction trie
     */
    fillFromResult(result, cumulativeGasUsed) {
        const vmResult = result.execResult;
        const execException = vmResult.exceptionError;
        let status;
        if (execException) {
            status = utils_1.BUFFER_ZERO;
            this.execException = new ethereum_utils_1.RuntimeError(this.hash, result, ethereum_utils_1.RETURN_TYPES.TRANSACTION_HASH);
        }
        else {
            status = ONE_BUFFER;
        }
        const receipt = (this.receipt = transaction_receipt_1.TransactionReceipt.fromValues(status, utils_1.Quantity.from(cumulativeGasUsed).toBuffer(), result.bloom.bitvector, (this.logs = vmResult.logs || []), result.gasUsed.toArrayLike(Buffer), result.createdAddress ? result.createdAddress.buf : null));
        return receipt.serialize(false);
    }
    getReceipt() {
        return this.receipt;
    }
    getLogs() {
        return this.logs;
    }
    /**
     * Returns a Promise that is resolved with the confirmation status and, if
     * appropriate, an error property.
     *
     * Note: it is possible to be confirmed AND have an error
     *
     * @param event "finalized"
     */
    once(_event) {
        return this.finalized;
    }
    /**
     * Mark this transaction as finalized, notifying all past and future
     * "finalized" event subscribers.
     *
     * Note:
     *
     * @param status
     * @param error
     */
    finalize(status, error = null) {
        // resolves the `#finalized` promise
        this.finalizer({ status, error });
    }
}
exports.RuntimeTransaction = RuntimeTransaction;
//# sourceMappingURL=runtime-transaction.js.map