"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function replaceFromHeap(priced, source) {
    // get the next best for this account, removing from the source Heap:
    const next = source.peek();
    if (next) {
        // remove the current best priced transaction from this account and replace
        // it with the account's next lowest nonce transaction:
        priced.replaceBest(next);
        next.locked = true;
        return true;
    }
    else {
        // since we don't have a next, just remove this item from priced
        return priced.removeBest();
    }
}
exports.default = replaceFromHeap;
//# sourceMappingURL=replace-from-heap.js.map