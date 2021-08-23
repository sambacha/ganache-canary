"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _paused, _process;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestCoordinator = void 0;
const noop = () => { };
/**
 * Responsible for managing global concurrent requests.
 */
class RequestCoordinator {
    /**
     * Promise-based FIFO queue.
     * @param limit The number of requests that can be processed at a time.
     * Default value is is no limit (`0`).
     */
    constructor(limit) {
        /**
         * The pending requests. You can't do anything with this array.
         */
        this.pending = [];
        /**
         * The number of tasks currently being processed.
         */
        this.runningTasks = 0;
        _paused.set(this, true);
        /**
         * Pause processing. This will *not* cancel any promises that are currently
         * running.
         */
        this.pause = () => {
            __classPrivateFieldSet(this, _paused, true);
        };
        /**
         * Resume processing.
         */
        this.resume = () => {
            __classPrivateFieldSet(this, _paused, false);
            __classPrivateFieldGet(this, _process).call(this);
        };
        _process.set(this, () => {
            // if we aren't paused and the number of things we're processing is under
            // our limit and we have things to process: do it!
            while (!this.paused &&
                this.pending.length > 0 &&
                (!this.limit || this.runningTasks < this.limit)) {
                const current = this.pending.shift();
                this.runningTasks++;
                current()
                    // By now, we've resolved the fn's `value` by sending it to the parent scope.
                    // But over here, we're also waiting for this fn's _value_ to settle _itself_ (it might be a promise) before
                    // continuing through the `pending` queue. Because we wait for it again here, it could potentially throw here,
                    // in which case we just need to catch it and throw the result away. We could probably use
                    // `Promise.allSettled([current()]).finally` to do this instead of the `current().catch(noop).finally`. /shrug
                    .catch(noop)
                    .finally(() => {
                    this.runningTasks--;
                    __classPrivateFieldGet(this, _process).call(this);
                });
            }
        });
        /**
         * Insert a new function into the queue.
         */
        this.queue = (fn, thisArgument, argumentsList) => {
            return new Promise((resolve, reject) => {
                // const executor is `async` to force the return value into a Promise.
                const executor = async () => {
                    try {
                        const value = Reflect.apply(fn, thisArgument, argumentsList || []);
                        resolve({ value });
                        return value;
                    }
                    catch (e) {
                        reject(e);
                    }
                };
                this.pending.push(executor);
                __classPrivateFieldGet(this, _process).call(this);
            });
        };
        this.limit = limit;
    }
    get paused() {
        return __classPrivateFieldGet(this, _paused);
    }
}
exports.RequestCoordinator = RequestCoordinator;
_paused = new WeakMap(), _process = new WeakMap();
//# sourceMappingURL=request-coordinator.js.map