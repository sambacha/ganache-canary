"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function Deferred() {
    const deferred = {};
    deferred.promise = new Promise((resolve, reject) => {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });
    return deferred;
}
exports.default = Deferred;
//# sourceMappingURL=deferred.js.map