"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChainOptions = void 0;
const helpers_1 = require("./helpers");
exports.ChainOptions = {
    ipfsHost: {
        normalize: helpers_1.normalize,
        cliDescription: "The IPFS simulator host name/address to listen on.",
        default: () => "127.0.0.1",
        cliType: "string"
    },
    ipfsPort: {
        normalize: helpers_1.normalize,
        cliDescription: "The IPFS simulator port.",
        default: () => 5001,
        cliType: "number"
    },
    asyncRequestProcessing: {
        normalize: helpers_1.normalize,
        cliDescription: "When set to `false` only one request will be processed at a time.",
        default: () => true,
        cliType: "boolean"
    }
};
//# sourceMappingURL=chain-options.js.map