"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverOptionsConfig = exports.serverDefaults = void 0;
const server_options_1 = require("./server-options");
const options_1 = require("@ganache/options");
exports.serverDefaults = {
    server: server_options_1.ServerOptions
};
exports.serverOptionsConfig = new options_1.OptionsConfig(exports.serverDefaults);
//# sourceMappingURL=index.js.map