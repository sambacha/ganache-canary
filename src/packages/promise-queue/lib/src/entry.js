"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Entry {
    constructor(promise, queue, onSetteled) {
        this.resolved = false;
        this.value = promise;
        this.queue = queue;
        this.onSetteled = onSetteled;
        const _onSetteled = () => this.onSetteled(this.queue, this);
        promise.then(_onSetteled, _onSetteled);
        this.promise = new Promise(resolve => {
            this.resolve = resolve;
        });
    }
}
exports.default = Entry;
//# sourceMappingURL=entry.js.map