#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __importStar(require("@ganache/core"));
const args_1 = __importDefault(require("./args"));
const flavors_1 = require("@ganache/flavors");
const ethereum_1 = __importDefault(require("./initialize/ethereum"));
const filecoin_1 = __importDefault(require("./initialize/filecoin"));
const logAndForceExit = (messages, exitCode = 0) => {
    // https://nodejs.org/api/process.html#process_process_exit_code
    // writes to process.stdout in Node.js are sometimes asynchronous and may occur over
    // multiple ticks of the Node.js event loop. Calling process.exit(), however, forces
    // the process to exit before those additional writes to stdout can be performed.
    // se we set stdout to block in order to successfully log before exiting
    if (process.stdout._handle) {
        process.stdout._handle.setBlocking(true);
    }
    try {
        messages.forEach(message => console.log(message));
    }
    catch (e) {
        console.log(e);
    }
    // force the process to exit
    process.exit(exitCode);
};
const { version: coreVersion } = { "version": "0.1.1-canary.1339" };
const { version: cliVersion } = { "version": "0.1.1-canary.1339" };
const { version } = { "version": "7.0.0-canary.1341" };
const detailedVersion = `ganache v${version} (@ganache/cli: ${cliVersion}, @ganache/core: ${coreVersion})`;
const isDocker = "DOCKER" in process.env && process.env.DOCKER.toLowerCase() === "true";
const argv = args_1.default(detailedVersion, isDocker);
const flavor = argv.flavor;
const cliSettings = argv.server;
console.log(detailedVersion);
let server;
try {
    server = core_1.default.server(argv);
}
catch (error) {
    console.error(error.message);
    process.exit(1);
}
let started = false;
process.on("uncaughtException", function (e) {
    if (started) {
        logAndForceExit([e], 1);
    }
    else {
        logAndForceExit([e.stack], 1);
    }
});
let receivedShutdownSignal = false;
const handleSignal = async (signal) => {
    console.log(`\nReceived shutdown signal: ${signal}`);
    closeHandler();
};
const closeHandler = async () => {
    try {
        // graceful shutdown
        switch (server.status) {
            case core_1.ServerStatus.opening:
                receivedShutdownSignal = true;
                console.log("Server is currently starting; waiting…");
                return;
            case core_1.ServerStatus.open:
                console.log("Shutting down…");
                await server.close();
                console.log("Server has been shut down");
                break;
        }
        // don't just call `process.exit()` here, as we don't want to hide shutdown
        // errors behind a forced shutdown. Note: `process.exitCode` doesn't do
        // anything other than act as a place to anchor this comment :-)
        process.exitCode = 0;
    }
    catch (err) {
        logAndForceExit([
            "\nReceived an error while attempting to shut down the server: ",
            err.stack || err
        ], 1);
    }
};
// See http://stackoverflow.com/questions/10021373/what-is-the-windows-equivalent-of-process-onsigint-in-node-js
if (process.platform === "win32") {
    const rl = require("readline")
        .createInterface({
        input: process.stdin,
        output: process.stdout
    })
        .on("SIGINT", () => {
        // we must "close" the RL interface otherwise the process will think we
        // are still listening
        // https://nodejs.org/api/readline.html#readline_event_sigint
        rl.close();
        handleSignal("SIGINT");
    });
}
process.on("SIGINT", handleSignal);
process.on("SIGTERM", handleSignal);
process.on("SIGHUP", handleSignal);
async function startGanache(err) {
    if (err) {
        console.log(err);
        process.exitCode = 1;
        return;
    }
    else if (receivedShutdownSignal) {
        closeHandler();
        return;
    }
    started = true;
    switch (flavor) {
        case flavors_1.FilecoinFlavorName: {
            await filecoin_1.default(server.provider, cliSettings);
            break;
        }
        case flavors_1.EthereumFlavorName:
        default: {
            ethereum_1.default(server.provider, cliSettings);
            break;
        }
    }
}
console.log("Starting RPC server");
server.listen(cliSettings.port, cliSettings.host, startGanache);
//# sourceMappingURL=cli.js.map