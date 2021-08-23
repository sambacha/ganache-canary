"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.provider = exports.server = exports.Server = void 0;
/*
 * This file is the entry point for the resultant bundle dist/node/ganache.min.js
 * dist/cli/ganache.min.js will then point to dist/node/ganache.min.js
 * whenever it references @ganache/core.
 * This is so we avoid an extra set of native node modules in dist/cli, just use what's in dist/node.
 */
var core_1 = require("@ganache/core");
Object.defineProperty(exports, "Server", { enumerable: true, get: function () { return core_1.Server; } });
Object.defineProperty(exports, "server", { enumerable: true, get: function () { return core_1.server; } });
Object.defineProperty(exports, "provider", { enumerable: true, get: function () { return core_1.provider; } });
const core_2 = __importDefault(require("@ganache/core"));
exports.default = core_2.default;
//# sourceMappingURL=index.js.map