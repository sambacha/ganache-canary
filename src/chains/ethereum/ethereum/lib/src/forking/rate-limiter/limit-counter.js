"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LimitCounter = void 0;
/**
 * @param timestamp
 * @returns the milliseconds that have elapsed since `timestamp`
 */
function timeSince(timestamp) {
    return Date.now() - timestamp;
}
class LimitCounter {
    constructor(windowLength) {
        this.counters = new Map();
        this.windowLength = windowLength;
    }
    evict() {
        const d = this.windowLength * 3;
        if (timeSince(this.lastEvict) < d) {
            return;
        }
        this.lastEvict = Date.now();
        const counters = this.counters;
        counters.forEach((v, k) => {
            if (timeSince(v.updatedAt) >= d) {
                counters.delete(k);
            }
        });
    }
    increment(currentWindow) {
        this.evict();
        let v = this.counters.get(currentWindow);
        if (v == null) {
            this.counters.set(currentWindow, { value: 1, updatedAt: Date.now() });
        }
        else {
            v.value += 1;
            v.updatedAt = Date.now();
        }
    }
    get(currentWindow, previousWindow) {
        let curr = this.counters.get(currentWindow);
        if (curr == null) {
            curr = { value: 0, updatedAt: Date.now() };
        }
        let prev = this.counters.get(previousWindow);
        if (prev == null) {
            prev = { value: 0, updatedAt: Date.now() };
        }
        return [curr.value, prev.value];
    }
}
exports.LimitCounter = LimitCounter;
//# sourceMappingURL=limit-counter.js.map