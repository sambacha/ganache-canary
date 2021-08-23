"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilecoinOptionsConfig = exports.FilecoinDefaults = void 0;
const chain_options_1 = require("./chain-options");
const database_options_1 = require("./database-options");
const logging_options_1 = require("./logging-options");
const miner_options_1 = require("./miner-options");
const wallet_options_1 = require("./wallet-options");
const options_1 = require("@ganache/options");
exports.FilecoinDefaults = {
    chain: chain_options_1.ChainOptions,
    database: database_options_1.DatabaseOptions,
    logging: logging_options_1.LoggingOptions,
    miner: miner_options_1.MinerOptions,
    wallet: wallet_options_1.WalletOptions
};
exports.FilecoinOptionsConfig = new options_1.OptionsConfig(exports.FilecoinDefaults);
//# sourceMappingURL=index.js.map