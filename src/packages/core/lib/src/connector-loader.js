"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@ganache/utils");
const flavors_1 = require("@ganache/flavors");
const flavors_2 = require("@ganache/flavors");
const initialize = (options = {
    flavor: flavors_1.DefaultFlavor,
    chain: { asyncRequestProcessing: true }
}) => {
    const flavor = (options.flavor || flavors_1.DefaultFlavor);
    // Set up our request coordinator to either use FIFO or or async request
    // processing. The RequestCoordinator _can_ be used to coordinate the number
    // of requests being processed, but we don't use it for that (yet), instead
    // of "all" (0) or just 1 as we are doing here:
    const asyncRequestProcessing = "chain" in options
        ? options["chain"].asyncRequestProcessing
        : options["asyncRequestProcessing"];
    const requestCoordinator = new utils_1.RequestCoordinator(asyncRequestProcessing ? 0 : 1);
    // The Executor is responsible for actually executing the method on the
    // chain/API. It performs some safety checks to ensure "safe" method
    //  execution before passing it to a RequestCoordinator.
    const executor = new utils_1.Executor(requestCoordinator);
    const connector = flavors_2.GetConnector(flavor, options, executor);
    // Purposely not awaiting on this to prevent a breaking change
    // to the `Ganache.provider()` method
    // TODO: remove the `connector.connect ? ` check and just use
    // `connector.connect()` after publishing the `@ganache/filecoin` with the
    // connector.connect interface
    const connectPromise = connector.connect
        ? connector.connect()
        : connector.initialize();
    // The request coordinator is initialized in a "paused" state; when the
    // provider is ready we unpause.. This lets us accept queue requests before
    // we've even fully initialized.
    connectPromise.then(requestCoordinator.resume);
    return connector;
};
/**
 * Loads the connector specified by the given `flavor`
 */
exports.default = {
    initialize
};
//# sourceMappingURL=connector-loader.js.map