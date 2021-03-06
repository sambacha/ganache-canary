"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KNOWN_CHAINIDS = exports.WEI = exports.RPCQUANTITY_ONE = exports.RPCQUANTITY_ZERO = exports.RPCQUANTITY_EMPTY = exports.BUFFER_8_ZERO = exports.BUFFER_32_ZERO = exports.BUFFER_ZERO = exports.BUFFER_EMPTY = exports.ACCOUNT_ZERO = exports.BUFFER_256_ZERO = void 0;
const json_rpc_quantity_1 = require("../things/json-rpc/json-rpc-quantity");
exports.BUFFER_256_ZERO = Buffer.allocUnsafe(256).fill(0);
exports.ACCOUNT_ZERO = exports.BUFFER_256_ZERO.slice(0, 20);
exports.BUFFER_EMPTY = Buffer.allocUnsafe(0);
exports.BUFFER_ZERO = exports.BUFFER_256_ZERO.slice(0, 1);
exports.BUFFER_32_ZERO = exports.BUFFER_256_ZERO.slice(0, 32);
exports.BUFFER_8_ZERO = exports.BUFFER_256_ZERO.slice(0, 8);
exports.RPCQUANTITY_EMPTY = json_rpc_quantity_1.Quantity.from(exports.BUFFER_EMPTY, true);
exports.RPCQUANTITY_ZERO = json_rpc_quantity_1.Quantity.from(exports.BUFFER_ZERO);
exports.RPCQUANTITY_ONE = json_rpc_quantity_1.Quantity.from(1n);
exports.WEI = 1000000000000000000n;
exports.KNOWN_CHAINIDS = new Set([1, 3, 4, 5, 42]);
//# sourceMappingURL=constants.js.map