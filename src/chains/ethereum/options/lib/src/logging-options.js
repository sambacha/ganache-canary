"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingOptions = void 0;
const helpers_1 = require("./helpers");
const logger = { log: console.log };
exports.LoggingOptions = {
    debug: {
        normalize: helpers_1.normalize,
        cliDescription: "Set to `true` to log EVM opcodes.",
        default: () => false,
        legacyName: "debug",
        cliType: "boolean"
    },
    logger: {
        normalize: helpers_1.normalize,
        cliDescription: "An object, like `console`, that implements a `log` function.",
        disableInCLI: true,
        default: () => logger,
        legacyName: "logger"
    },
    verbose: {
        normalize: helpers_1.normalize,
        cliDescription: "Set to `true` to log all RPC requests and responses.",
        default: () => false,
        legacyName: "verbose",
        cliAliases: ["v", "verbose"],
        cliType: "boolean"
    },
    quiet: {
        normalize: helpers_1.normalize,
        cliDescription: "Set to `true` to disable logging.",
        default: () => false,
        cliAliases: ["q", "quiet"],
        cliType: "boolean"
    }
};
//# sourceMappingURL=logging-options.js.map