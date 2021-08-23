"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeTransaction = void 0;
const runtime_transaction_1 = require("./runtime-transaction");
/**
 * A FakeTransaction spoofs the from address and signature.
 */
class FakeTransaction extends runtime_transaction_1.RuntimeTransaction {
    constructor(data, common) {
        super(data, common);
        if (this.from == null) {
            throw new Error("Internal Error: FakeTransaction initialized without a `from` field.");
        }
    }
}
exports.FakeTransaction = FakeTransaction;
//# sourceMappingURL=fake-transaction.js.map