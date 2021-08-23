"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@ganache/utils");
const ethereumjs_util_1 = require("ethereumjs-util");
function default_1(provider, cliSettings) {
    const liveOptions = provider.getOptions();
    const accounts = provider.getInitialAccounts();
    const addresses = Object.keys(accounts);
    console.log("");
    console.log("Available Accounts");
    console.log("==================");
    if (addresses.length > 0) {
        addresses.forEach(function (address, index) {
            const balance = accounts[address].balance;
            const strBalance = balance / utils_1.WEI;
            const about = balance % utils_1.WEI === 0n ? "" : "~";
            let line = `(${index}) ${ethereumjs_util_1.toChecksumAddress(address)} (${about}${strBalance} ETH)`;
            if (!accounts[address].unlocked) {
                line += " 🔒";
            }
            console.log(line);
        });
        console.log("");
        console.log("Private Keys");
        console.log("==================");
        addresses.forEach(function (address, index) {
            console.log(`(${index}) ${accounts[address].secretKey}`);
        });
        if (liveOptions.wallet.accountKeysPath != null) {
            console.log("");
            console.log(`Accounts and keys saved to ${liveOptions.wallet.accountKeysPath}`);
        }
    }
    else {
        console.log("(no accounts unlocked)");
    }
    if (liveOptions.wallet.accounts == null) {
        console.log("");
        console.log("HD Wallet");
        console.log("==================");
        console.log(`Mnemonic:      ${liveOptions.wallet.mnemonic}`);
        console.log(`Base HD Path:  ${liveOptions.wallet.hdPath}{account_index}`);
    }
    if (liveOptions.miner.defaultGasPrice) {
        console.log("");
        console.log("Default Gas Price");
        console.log("==================");
        console.log(liveOptions.miner.defaultGasPrice.toBigInt());
    }
    if (liveOptions.miner.blockGasLimit) {
        console.log("");
        console.log("BlockGas Limit");
        console.log("==================");
        console.log(liveOptions.miner.blockGasLimit.toBigInt());
    }
    if (liveOptions.miner.callGasLimit) {
        console.log("");
        console.log("Call Gas Limit");
        console.log("==================");
        console.log(liveOptions.miner.callGasLimit.toBigInt());
    }
    if (liveOptions.fork.url) {
        console.log("");
        console.log("Forked Chain");
        console.log("==================");
        console.log(`Location:        ${liveOptions.fork.url.toString()}`);
        console.log(`Block:           ${liveOptions.fork.blockNumber}`);
        console.log(`Network ID:      ${liveOptions.chain.networkId}`);
        console.log(`Time:            ${new Date().toString()}`);
        if (liveOptions.fork.requestsPerSecond !== 0) {
            console.log(`Requests/Second: ${liveOptions.fork.requestsPerSecond}`);
        }
    }
    console.log("");
    console.log("Chain Id");
    console.log("==================");
    console.log(liveOptions.chain.chainId);
    console.log("");
    console.log("RPC Listening on " + cliSettings.host + ":" + cliSettings.port);
}
exports.default = default_1;
//# sourceMappingURL=ethereum.js.map