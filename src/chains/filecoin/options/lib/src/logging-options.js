"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingOptions = void 0;
const helpers_1 = require("./helpers");
const logger = { log: console.log };
exports.LoggingOptions = {
    logger: {
        normalize: helpers_1.normalize,
        cliDescription: "An object, like `console`, that implements a `log` function.",
        disableInCLI: true,
        default: () => logger
    }
};
//# sourceMappingURL=logging-options.js.map