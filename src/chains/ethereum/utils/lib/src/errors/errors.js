"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VM_EXCEPTIONS = exports.VM_EXCEPTION = exports.GAS_LIMIT = exports.INTRINSIC_GAS_TOO_LOW = exports.UNDERPRICED = exports.NONCE_TOO_LOW = exports.INVALID_SENDER = void 0;
/**
 * Returned if the transaction contains an invalid signature.
 */
exports.INVALID_SENDER = "invalid sender";
/**
 * Returned if the nonce of a transaction is lower than the one present in the local chain.
 */
exports.NONCE_TOO_LOW = "nonce too low";
/**
 * Returned if a transaction's gas price is below the minimum configured for the transaction pool.
 */
exports.UNDERPRICED = "transaction underpriced";
/**
 * Returned if the transaction is specified to use less gas than required to start the invocation.
 */
exports.INTRINSIC_GAS_TOO_LOW = "intrinsic gas too low";
/**
 * Returned if a transaction's requested gas limit exceeds the maximum allowance of the current block.
 */
exports.GAS_LIMIT = "exceeds block gas limit";
/**
 * Prefix for a single VM Exception occuring when running a transaction or block
 */
exports.VM_EXCEPTION = "VM Exception while processing transaction: ";
/**
 * Prefix for multiple VM Exceptions occuring when running transactions or a block
 */
exports.VM_EXCEPTIONS = "Multiple VM Exceptions while processing transactions: : \n\n";
//# sourceMappingURL=errors.js.map