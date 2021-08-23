"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCall = void 0;
const utils_1 = require("@ganache/utils");
const message_1 = __importDefault(require("@ethereumjs/vm/dist/evm/message"));
const ethereumjs_util_1 = require("ethereumjs-util");
const evm_1 = __importDefault(require("@ethereumjs/vm/dist/evm/evm"));
/**
 * Executes a message/transaction against the vm.
 * @param vm
 * @param transaction
 * @param gasLeft
 * @returns
 */
function runCall(vm, transaction, gasLeft) {
    const caller = { buf: transaction.from.toBuffer() };
    const to = transaction.to == null ? undefined : { buf: transaction.to.toBuffer() };
    const value = new ethereumjs_util_1.BN(transaction.value == null ? 0 : transaction.value.toBuffer());
    const txContext = {
        gasPrice: new ethereumjs_util_1.BN(transaction.gasPrice.toBuffer()),
        origin: caller
    };
    const message = new message_1.default({
        caller,
        gasLimit: new ethereumjs_util_1.BN(utils_1.Quantity.from(gasLeft).toBuffer()),
        to,
        value,
        data: transaction.data && transaction.data.toBuffer()
    });
    const evm = new evm_1.default(vm, txContext, transaction.block);
    return evm.executeMessage(message);
}
exports.runCall = runCall;
//# sourceMappingURL=run-call.js.map