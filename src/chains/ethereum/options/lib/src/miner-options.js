"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinerOptions = void 0;
const helpers_1 = require("./helpers");
const utils_1 = require("@ganache/utils");
const ethereum_address_1 = require("@ganache/ethereum-address");
/**
 * Attempts to convert strings that don't start with `0x` to a BigInt
 *
 * @param str a string that represents a bigint, number, or hex number
 */
const toBigIntOrString = (str) => {
    if (str.startsWith("0x")) {
        return str;
    }
    else {
        return BigInt(str);
    }
};
exports.MinerOptions = {
    blockTime: {
        normalize: rawInput => {
            if (rawInput < 0) {
                throw new Error("miner.blockTime must be 0 or a positive number.");
            }
            return rawInput;
        },
        cliDescription: 'Sets the `blockTime` in seconds for automatic mining. A blockTime of `0` enables "instamine mode", where new executable transactions will be mined instantly.',
        default: () => 0,
        legacyName: "blockTime",
        cliAliases: ["b", "blockTime"],
        cliType: "number"
    },
    defaultGasPrice: {
        normalize: utils_1.Quantity.from,
        cliDescription: "Sets the default gas price in WEI for transactions if not otherwise specified.",
        default: () => utils_1.Quantity.from(2000000000),
        legacyName: "gasPrice",
        cliAliases: ["g", "gasPrice"],
        cliType: "string",
        cliCoerce: toBigIntOrString
    },
    blockGasLimit: {
        normalize: utils_1.Quantity.from,
        cliDescription: "Sets the block gas limit in WEI.",
        default: () => utils_1.Quantity.from(12000000),
        legacyName: "gasLimit",
        cliAliases: ["l", "gasLimit"],
        cliType: "string",
        cliCoerce: toBigIntOrString
    },
    defaultTransactionGasLimit: {
        normalize: rawType => rawType === "estimate" ? utils_1.RPCQUANTITY_EMPTY : utils_1.Quantity.from(rawType),
        cliDescription: 'Sets the default transaction gas limit in WEI. Set to "estimate" to use an estimate (slows down transaction execution by 40%+).',
        default: () => utils_1.Quantity.from(90000),
        cliType: "string",
        cliCoerce: toBigIntOrString
    },
    difficulty: {
        normalize: utils_1.Quantity.from,
        cliDescription: "Sets the block difficulty.",
        default: () => utils_1.RPCQUANTITY_ONE,
        cliType: "string",
        cliCoerce: toBigIntOrString
    },
    callGasLimit: {
        normalize: utils_1.Quantity.from,
        cliDescription: "Sets the transaction gas limit in WEI for `eth_call` and `eth_estimateGas` calls.",
        default: () => utils_1.Quantity.from(Number.MAX_SAFE_INTEGER),
        legacyName: "callGasLimit",
        cliType: "string",
        cliCoerce: toBigIntOrString
    },
    legacyInstamine: {
        normalize: helpers_1.normalize,
        cliDescription: "Enables legacy instamine mode, where transactions are fully mined before the transaction's hash is returned to the caller.",
        default: () => false,
        legacyName: "legacyInstamine",
        cliType: "boolean"
    },
    coinbase: {
        normalize: rawType => {
            return typeof rawType === "number" ? rawType : ethereum_address_1.Address.from(rawType);
        },
        cliDescription: "Sets the address where mining rewards will go.",
        default: () => ethereum_address_1.Address.from(utils_1.ACCOUNT_ZERO)
    },
    extraData: {
        normalize: (extra) => {
            const bytes = utils_1.Data.from(extra);
            if (bytes.toBuffer().length > 32) {
                throw new Error(`extra exceeds max length. ${bytes.toBuffer().length} > 32`);
            }
            return bytes;
        },
        cliDescription: "Set the extraData block header field a miner can include.",
        default: () => utils_1.Data.from(utils_1.BUFFER_EMPTY),
        cliType: "string"
    }
};
//# sourceMappingURL=miner-options.js.map