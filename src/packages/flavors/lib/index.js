"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetConnector = exports.DefaultOptionsByName = exports.DefaultFlavor = exports.FilecoinFlavorName = exports.EthereumFlavorName = void 0;
const ethereum_1 = require("@ganache/ethereum");
const ethereum_options_1 = require("@ganache/ethereum-options");
const filecoin_options_1 = require("@ganache/filecoin-options");
const chalk_1 = __importDefault(require("chalk"));
// we need "@ganache/options" in order for TS to properly infer types for `DefaultOptionsByName`
require("@ganache/options");
const NEED_HELP = "Need help? Reach out to the Truffle community at";
const COMMUNITY_LINK = "https://trfl.co/support";
exports.EthereumFlavorName = "ethereum";
exports.FilecoinFlavorName = "filecoin";
exports.DefaultFlavor = exports.EthereumFlavorName;
exports.DefaultOptionsByName = {
    [exports.EthereumFlavorName]: ethereum_options_1.EthereumDefaults,
    [exports.FilecoinFlavorName]: filecoin_options_1.FilecoinDefaults
};
function GetConnector(flavor, providerOptions, executor) {
    if (flavor === exports.DefaultFlavor) {
        return new ethereum_1.Connector(providerOptions, executor);
    }
    try {
        switch (flavor) {
            case exports.FilecoinFlavorName: {
                flavor = "@ganache/filecoin";
                // TODO: remove the `typeof f.default != "undefined" ? ` check once the
                // published filecoin plugin is updated to
                const f = eval("require")(flavor);
                const Connector = typeof f.default != "undefined" ? f.default.Connector : f.Connector;
                // @ts-ignore
                return new Connector(providerOptions, executor);
            }
            default: {
                // for future plugin compat
                const { Connector } = require(flavor);
                return new Connector(providerOptions, executor);
            }
        }
    }
    catch (e) {
        if (e.message.includes(`Cannot find module '${flavor}'`)) {
            // we print and exit rather than throw to prevent webpack output from being
            // spat out for the line number
            console.warn(chalk_1.default `\n\n{red.bold ERROR:} Could not find Ganache flavor "{bold filecoin}" (${flavor}); ` +
                `it probably\nneeds to be installed.\n` +
                ` ▸ if you're using Ganache as a library run: \n` +
                chalk_1.default `   {blue.bold $ npm install ${flavor}}\n` +
                ` ▸ if you're using Ganache as a CLI run: \n` +
                chalk_1.default `   {blue.bold $ npm install --global ${flavor}}\n\n`
            // TODO: uncomment once we have a valid domain
            // + chalk`{hex("${TruffleColors.porsche}").bold ${NEED_HELP}}\n` +
            // chalk`{hex("${TruffleColors.turquoise}") ${COMMUNITY_LINK}}\n\n`
            );
            process.exit(1);
        }
        else {
            throw e;
        }
    }
}
exports.GetConnector = GetConnector;
//# sourceMappingURL=index.js.map