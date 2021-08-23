"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.provider = exports.server = exports._DefaultServerOptions = exports.ServerStatus = exports.Server = void 0;
const connector_loader_1 = __importDefault(require("./src/connector-loader"));
const server_1 = __importDefault(require("./src/server"));
var server_2 = require("./src/server");
Object.defineProperty(exports, "Server", { enumerable: true, get: function () { return server_2.Server; } });
Object.defineProperty(exports, "ServerStatus", { enumerable: true, get: function () { return server_2.ServerStatus; } });
Object.defineProperty(exports, "_DefaultServerOptions", { enumerable: true, get: function () { return server_2._DefaultServerOptions; } });
/**
 * @public
 */
const Ganache = {
    /**
     * Creates a Ganache server instance that creates and
     * serves an underlying Ganache provider. Initialization
     * doesn't begin until `server.listen(...)` is called.
     * `server.listen(...)` returns a promise that resolves
     * when initialization is finished.
     *
     * @param options - Configuration options for the server;
     * `options` includes provider based options as well.
     * @returns A provider instance for the flavor
     * `options.flavor` which defaults to `ethereum`.
     */
    server: (options) => new server_1.default(options),
    /**
     * Initializes a Web3 provider for a Ganache instance.
     * This function starts an asynchronous task, but does not
     * finish it by the time the function returns. Listen to
     * `provider.on("connect", () => {...})` or wait for
     * `await provider.once("connect")` for initialization to
     * finish. You may start sending requests to the provider
     * before initialization finishes however; these requests
     * will start being consumed after initialization finishes.
     *
     * @param options - Configuration options for the provider.
     * @returns A provider instance for the flavor
     * `options.flavor` which defaults to `ethereum`.
     */
    provider: (options) => {
        const connector = connector_loader_1.default.initialize(options);
        return connector.provider;
    }
};
exports.server = Ganache.server;
exports.provider = Ganache.provider;
/**
 * @public
 */
exports.default = Ganache;
//# sourceMappingURL=index.js.map