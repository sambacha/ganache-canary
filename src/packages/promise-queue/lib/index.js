"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _queue, _tryResolve, _tryResolveChain;
Object.defineProperty(exports, "__esModule", { value: true });
const emittery_1 = __importDefault(require("emittery"));
const entry_1 = __importDefault(require("./src/entry"));
const emitteryMethods = ["emit", "once"];
/**
 * Creates a FIFO queue that ensures promises are _resolved_ in the order
 * they were added.
 *
 * This is different than a FIFO queue that _executes_ functions that
 * return promises; this queue is for the promises themselves.
 *
 * @example
 * ```javascript
 * const queue = new PromiseQueue();
 *
 * const slow = new Promise(resolve => setTimeout(resolve, 1000, "slow"));
 * const fast = Promise.resolve("fast");
 *
 * await Promise.race([
 *   queue.add(slow),
 *   queue.add(fast)
 * ]); // returns "slow"
 *
 * // Additionally, the queued promise chain can be cleared via `queue.clear(value)`.
 * // This will cause the chain of promises to all resolve immediately with the
 * // given value. *
 * //
 * // * note: whatever the promise starting doing when it was created will still
 * // happen, no promises are aborted; rather, the return value is ignored.
 * ```
 */
let PromiseQueue = class PromiseQueue {
    constructor() {
        // TODO(perf): a singly linked list is probably a better option here
        _queue.set(this, []);
        _tryResolve.set(this, (queue, entry) => {
            // if this is now the highest priority entry, resolve the outer
            // Promise
            if (entry === queue[0]) {
                queue.shift();
                entry.resolve(entry.value);
                // then try resolving the rest
                __classPrivateFieldGet(this, _tryResolveChain).call(this, queue);
            }
            else {
                entry.resolved = true;
            }
        });
        /**
         * Removes all _resolved_ promises from the front of the chain of promises.
         */
        _tryResolveChain.set(this, (queue) => {
            let first = queue[0];
            while (first && first.resolved) {
                queue.shift();
                first.resolve(first.value);
                first = queue[0];
            }
            // if there is nothing left to do emit `"idle"`
            if (queue.length === 0) {
                this.emit("idle");
            }
        });
    }
    /**
     * Returns true if there are promises pending in the queue
     */
    isBusy() {
        return __classPrivateFieldGet(this, _queue).length !== 0;
    }
    /**
     * Adds the promise to the end of the queue.
     * @param promise
     * @returns a promise that resolves with the given promise's result. If the
     * queue was `clear`ed before the promise could be shifted off the return
     * value will be the `value` passed to `clear`.
     */
    add(promise) {
        const queue = __classPrivateFieldGet(this, _queue);
        const entry = new entry_1.default(promise, queue, __classPrivateFieldGet(this, _tryResolve));
        queue.push(entry);
        return entry.promise;
    }
    /**
     * Clears all promises from the queue and sets their resolved values to the
     * given value.
     */
    clear(value) {
        // remove all entrys from the queue and mark them.
        const cancelledQueue = __classPrivateFieldGet(this, _queue).splice(0);
        cancelledQueue.forEach(entry => {
            entry.queue = cancelledQueue;
            entry.value = value;
        });
    }
};
_queue = new WeakMap(), _tryResolve = new WeakMap(), _tryResolveChain = new WeakMap();
PromiseQueue = __decorate([
    emittery_1.default.mixin(Symbol.for("emittery"), emitteryMethods)
], PromiseQueue);
exports.default = PromiseQueue;
//# sourceMappingURL=index.js.map