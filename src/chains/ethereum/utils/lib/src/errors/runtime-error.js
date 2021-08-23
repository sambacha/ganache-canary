"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeError = exports.RETURN_TYPES = void 0;
const errors_1 = require("./errors");
const utils_1 = require("@ganache/utils");
const ethereumjs_abi_1 = require("ethereumjs-abi");
const coded_error_1 = require("./coded-error");
const utils_2 = require("@ganache/utils");
const REVERT_REASON = Buffer.from("08c379a0", "hex"); // keccak("Error(string)").slice(0, 4)
var RETURN_TYPES;
(function (RETURN_TYPES) {
    RETURN_TYPES[RETURN_TYPES["TRANSACTION_HASH"] = 0] = "TRANSACTION_HASH";
    RETURN_TYPES[RETURN_TYPES["RETURN_VALUE"] = 1] = "RETURN_VALUE";
})(RETURN_TYPES = exports.RETURN_TYPES || (exports.RETURN_TYPES = {}));
class RuntimeError extends coded_error_1.CodedError {
    constructor(transactionHash, result, returnType) {
        const execResult = result.execResult;
        const error = execResult.exceptionError.error;
        let message = errors_1.VM_EXCEPTION + error;
        super(message, utils_2.JsonRpcErrorCode.INVALID_INPUT);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        const returnValue = execResult.returnValue;
        const hash = transactionHash.toString();
        let reason;
        if (returnValue.length > 4 &&
            REVERT_REASON.compare(returnValue, 0, 4) === 0) {
            try {
                // it is possible for the `returnValue` to be gibberish that can't be
                // decoded. See: https://github.com/trufflesuite/ganache/pull/452
                reason = ethereumjs_abi_1.rawDecode(["bytes"], returnValue.slice(4))[0].toString();
                message += " " + reason;
            }
            catch {
                // ignore error since reason string recover is impossible
                reason = null;
            }
        }
        else {
            reason = null;
        }
        this.message = message;
        this.data = {
            hash: hash,
            programCounter: execResult.runState.programCounter,
            result: returnType === RETURN_TYPES.TRANSACTION_HASH
                ? hash
                : utils_1.Data.from(returnValue || "0x").toString(),
            reason: reason,
            message: error
        };
    }
}
exports.RuntimeError = RuntimeError;
//# sourceMappingURL=runtime-error.js.map