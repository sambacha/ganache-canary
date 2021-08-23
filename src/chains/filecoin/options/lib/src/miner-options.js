"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinerOptions = void 0;
const helpers_1 = require("./helpers");
exports.MinerOptions = {
    blockTime: {
        normalize: value => Math.max(0, value),
        cliDescription: 'Sets the `blockTime` in seconds for automatic mining. A `blockTime` of `0` or a negative number enables "instamine mode", where new executable transactions will be mined instantly.',
        default: () => 0,
        cliType: "number"
    },
    mine: {
        normalize: helpers_1.normalize,
        cliDescription: "Enable mining. Set to `false` to pause the miner.",
        default: () => true,
        cliType: "boolean"
    }
};
//# sourceMappingURL=miner-options.js.map