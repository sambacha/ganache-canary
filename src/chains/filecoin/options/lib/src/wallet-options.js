"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletOptions = void 0;
const helpers_1 = require("./helpers");
const seedrandom_1 = __importDefault(require("seedrandom"));
const options_1 = require("@ganache/options");
const unseededRng = seedrandom_1.default();
const randomAlphaNumericString = (() => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const alphabetLength = alphabet.length;
    return (length, rng) => {
        let text = "";
        for (let i = 0; i < length; i++) {
            text += alphabet[(rng() * alphabetLength) | 0];
        }
        return text;
    };
})();
exports.WalletOptions = {
    totalAccounts: {
        normalize: helpers_1.normalize,
        cliDescription: "Number of accounts to generate at startup.",
        default: () => 10,
        cliAliases: ["a"],
        cliType: "number"
    },
    deterministic: {
        normalize: helpers_1.normalize,
        cliDescription: "Use pre-defined, deterministic seed.",
        default: () => false,
        cliAliases: ["d"],
        cliType: "boolean",
        conflicts: ["seed"]
    },
    seed: {
        normalize: helpers_1.normalize,
        cliDescription: "Seed to use to generate a mnemonic.",
        // The order of the options matter here! `wallet.deterministic`
        // needs to be prior to `wallet.seed` for `config.deterministic`
        // below to be set correctly
        default: config => config.deterministic === true
            ? options_1.DeterministicSeedPhrase
            : randomAlphaNumericString(10, unseededRng),
        cliAliases: ["s"],
        cliType: "string",
        conflicts: ["deterministic"]
    },
    defaultBalance: {
        normalize: helpers_1.normalize,
        cliDescription: "The default account balance, specified in FIL.",
        default: () => 100,
        cliAliases: ["b"],
        cliType: "number"
    }
};
//# sourceMappingURL=wallet-options.js.map