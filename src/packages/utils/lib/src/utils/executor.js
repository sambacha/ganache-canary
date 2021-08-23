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
var _requestCoordinator;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Executor = void 0;
const has_own_1 = require("./has-own");
class Executor {
    /**
     * The Executor handles execution of methods on the given API
     */
    constructor(requestCoordinator) {
        _requestCoordinator.set(this, void 0);
        __classPrivateFieldSet(this, _requestCoordinator, requestCoordinator);
    }
    /**
     * Executes the method with the given methodName on the API
     * @param methodName The name of the JSON-RPC method to execute.
     * @param params The params to pass to the JSON-RPC method.
     */
    execute(api, methodName, params) {
        // The methodName is user-entered data and can be all sorts of weird hackery
        // Make sure we only accept what we expect to avoid headache and heartache
        if (typeof methodName === "string") {
            // Only allow executing our *own* methods. We allow:
            //  * functions added to the Instance by the class, e.g.,
            //      class SomeClass {
            //        method = () => {} // api.hasOwnProperty("method") === true
            //      }
            //  * Or by the class' prototype:
            //      class SomeClass {
            //        method(){} // api.__proto__.hasOwnProperty("method") === true
            //      }
            if ((has_own_1.hasOwn(api.__proto__, methodName) && methodName !== "constructor") ||
                has_own_1.hasOwn(api, methodName)) {
                // cast methodName from `KnownKeys<T> & string` back to KnownKeys<T> so our return type isn't weird.
                const fn = api[methodName];
                // just double check, in case a API breaks the rules and adds non-fns
                // to their API interface.
                if (typeof fn === "function") {
                    // queue up this method for actual execution:
                    return __classPrivateFieldGet(this, _requestCoordinator).queue(fn, api, params);
                }
            }
        }
        throw new Error(`The method ${methodName} does not exist/is not available`);
    }
}
exports.Executor = Executor;
_requestCoordinator = new WeakMap();
//# sourceMappingURL=executor.js.map