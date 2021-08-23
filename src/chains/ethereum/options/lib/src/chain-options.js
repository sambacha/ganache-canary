"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChainOptions = void 0;
const helpers_1 = require("./helpers");
const HARDFORKS = [
    "constantinople",
    "byzantium",
    "petersburg",
    "istanbul",
    "muirGlacier",
    "berlin"
];
exports.ChainOptions = {
    allowUnlimitedContractSize: {
        normalize: helpers_1.normalize,
        cliDescription: "Allows unlimited contract sizes while debugging. Setting this to `true` will cause ganache to behave differently than production environments.",
        default: () => false,
        legacyName: "allowUnlimitedContractSize",
        cliType: "boolean"
    },
    asyncRequestProcessing: {
        normalize: helpers_1.normalize,
        cliDescription: "When set to `false` only one request will be processed at a time.",
        default: () => true,
        legacyName: "asyncRequestProcessing",
        cliType: "boolean"
    },
    chainId: {
        normalize: helpers_1.normalize,
        cliDescription: "The currently configured chain id.",
        default: () => 1337,
        legacyName: "chainId",
        cliType: "number"
    },
    networkId: {
        normalize: helpers_1.normalize,
        cliDescription: "The id of the network returned by the RPC method `net_version`.",
        default: () => Date.now(),
        defaultDescription: "System time at process start or Network ID of forked blockchain if configured.",
        legacyName: "network_id",
        cliAliases: ["i", "networkId"],
        cliType: "number"
    },
    time: {
        normalize: rawInput => {
            if (typeof rawInput === "string") {
                return new Date(rawInput);
            }
            else {
                return rawInput;
            }
        },
        cliDescription: "Date that the first block should start.",
        legacyName: "time",
        cliAliases: ["t", "time"],
        cliType: "number"
    },
    hardfork: {
        normalize: helpers_1.normalize,
        cliDescription: "Set the hardfork rules for the EVM.",
        default: () => "berlin",
        legacyName: "hardfork",
        cliAliases: ["k", "hardfork"],
        cliType: "string",
        cliChoices: HARDFORKS
    },
    vmErrorsOnRPCResponse: {
        normalize: helpers_1.normalize,
        cliDescription: "Whether to report runtime errors from EVM code as RPC errors.",
        default: () => false,
        legacyName: "vmErrorsOnRPCResponse",
        cliType: "boolean"
    }
};
//# sourceMappingURL=chain-options.js.map