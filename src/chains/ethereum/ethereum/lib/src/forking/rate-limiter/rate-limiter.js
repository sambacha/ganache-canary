"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethereum_utils_1 = require("@ganache/ethereum-utils");
const utils_1 = require("@ganache/utils");
const semaphore_1 = __importDefault(require("semaphore"));
const limit_counter_1 = require("./limit-counter");
/**
 * Sleeps the specified number of milliseconds, then resolves the Promise.
 * Rejects with an `AbortError` if the provided `signal` is already aborted. If
 * the signal's `"abort"` event is invoked while sleeping, the the promise
 * rejects with an `AbortError`.
 *
 * @param ms the number of milliseconds to wait before resolving
 * @param abortSignal the
 * @returns a promise that resolves when `ms`milliseconds have elapsed, or
 * rejects if the `signal` is aborted.
 */
const sleep = (ms, signal) => {
    if (signal.aborted)
        return Promise.reject(new ethereum_utils_1.AbortError());
    return new Promise((resolve, reject) => {
        function abort() {
            clearTimeout(timer);
            signal.removeEventListener("abort", abort);
            reject(new ethereum_utils_1.AbortError());
        }
        const timer = setTimeout(() => {
            signal.removeEventListener("abort", abort);
            resolve();
        }, ms);
        signal.addEventListener("abort", abort);
    });
};
/**
 * @param timestamp
 * @param duration
 * @returns the result of rounding `timestamp` toward zero to a multiple of
 * `duration`.
 */
function timeTruncate(timestamp, duration) {
    return timestamp - (timestamp % duration);
}
/**
 * @param result
 * @returns true if the result is a JSON-RPC LIMIT_EXCEEDED error
 */
function isExceededLimitError(result) {
    return ("error" in result && result.error.code === utils_1.JsonRpcErrorCode.LIMIT_EXCEEDED);
}
/**
 * A sliding window rate limiter.
 *
 * Rate estimation from
 * https://blog.cloudflare.com/counting-things-a-lot-of-different-things/
 *
 * Let's say we set a limit of 50 requests per minute. The counter can be
 * thought of like this:
 *
 * ```ascii
 *         ╔══════════════════════════════════╗
 *         ║   sampling period: 60 seconds    ║
 * ╭───────╫────────────────────────┬─────────╫──────────────────────╮
 * │       ║previous minute         │         current minute         │
 * │       ║  42 requests           │         ║18 requests           │
 * ╰───────╫────────────────────────┼─────────╫──────────────────────╯
 *         ║         45 secs        │ 15 secs ║
 *         ╚════════════════════════╧═════════╝
 * ```
 *
 * In this situation, we did 18 requests during the current minute, which
 * started 15 seconds ago, and 42 requests during the entire previous minute.
 * Based on this information, the rate approximation is calculated like this:
 *
 * ```javascript
 * rate = (42 * (45 / 60)) + 18
 *      = (42 * 0.75) + 18
 *      = 49.5 // requests
 *
 *      = 59.5 // requests
 * ```
 *
 * One more request during the next second and the rate limiter will kick in.
 *
 * This algorithm assumes a constant rate of requests during the previous
 * sampling period (which can be any time span), so the result is only
 * an approximation of the actual rate, but it is quick to calculate and
 * lightweight.
 */
class RateLimiter {
    constructor(requestLimit, windowSizeMs, abortSignal) {
        this.sem = semaphore_1.default(1);
        this.take = () => new Promise(resolve => this.sem.take(resolve));
        this.mustBackoff = null;
        this.counter = 0;
        this.requestLimit = requestLimit;
        // the rate limiter splits the window in 2 to measure the RPS
        this.windowSizeMs = windowSizeMs / 2;
        this.limitCounter = new limit_counter_1.LimitCounter(this.windowSizeMs);
        this.abortSignal = abortSignal;
    }
    /**
     * @param now
     * @param currentWindow
     * @returns the current request rate and the allowed execution time of the
     * next request
     */
    status(now, currentWindow) {
        const limit = this.requestLimit;
        const windowSizeMs = this.windowSizeMs;
        const currWindow = currentWindow;
        const prevWindow = currWindow - windowSizeMs;
        const [currCount, prevCount] = this.limitCounter.get(currWindow, prevWindow);
        let rate;
        if (prevCount === 0) {
            rate = currCount;
        }
        else {
            // use the average for the previous window, plus everything for this
            // window
            rate =
                prevCount * ((windowSizeMs - (now - currWindow)) / windowSizeMs) +
                    currCount;
        }
        // limit <= 0 means the limiter is disabled
        if (limit > 0 && rate + 1 > limit) {
            const nextCount = currCount + 1;
            const nextLimit = limit + 1;
            const next = prevCount === 0
                ? currWindow + windowSizeMs + windowSizeMs / nextLimit
                : (windowSizeMs * (prevCount + nextCount - nextLimit)) / prevCount +
                    currWindow;
            return { rate, next };
        }
        return { rate, next: now };
    }
    /**
     * Executes the given fn within the confines of the configured rate limit. If
     * the function's return value is a JSON-RPC LIMIT_EXCEEDED error, it will
     * automatically retry with the given `backoff_seconds`
     * @param fn
     */
    async handle(fn) {
        // allow scheduling one fn at a time
        await this.take();
        try {
            return await this.schedule(fn);
        }
        finally {
            this.sem.leave();
        }
    }
    async schedule(fn) {
        const signal = this.abortSignal;
        while (true) {
            if (signal.aborted)
                return Promise.reject(new ethereum_utils_1.AbortError());
            if (this.mustBackoff)
                await this.mustBackoff;
            const now = Date.now();
            const currentWindow = timeTruncate(now, this.windowSizeMs);
            const { rate, next } = this.status(now, currentWindow);
            // process.stdout.write(
            //   `rate: ${rate}, wait: ${next - now}              \r`
            // );
            // if this request would be over the rate limit and the amount of time
            // we'd need to back off is > 1ms we need to schedule this in the future
            if (rate + 1 > this.requestLimit && next > now) {
                await sleep(Date.now() - next, signal);
            }
            else {
                this.limitCounter.increment(currentWindow);
                const result = await fn();
                if (isExceededLimitError(result)) {
                    if ("rate" in result.error.data) {
                        const backoffSeconds = result.error.data.rate.backoff_seconds;
                        // console.log(`backing off for ${backoffSeconds}`);
                        // console.log(result.error.data.rate);
                        // TODO: I need to make all in-flight requests that will soon return
                        // a LIMIT_EXCEEDED error behave, otherwise we'll just send ALL
                        // requests back to Infura simultaneously after their initial 30
                        // backoff_seconds have elapsed.
                        //
                        // When we are *not* self-rate limited (meaning fork.rps isn't set)
                        // we need to be able to go at full speed until we are, and THEN we
                        // need to go at whatever infura wants.
                        //
                        // TODO: TODO: ask infura to add the X-Rate-Limit* headers to all
                        // HTTP responses so we can poll for info to help us avoid ever
                        // getting rate limited in the first place.
                        // this is part of an attempt at solving the above comment
                        this.requestLimit =
                            result.error.data.rate.allowed_rps * (this.windowSizeMs / 1000);
                        const limiter = (this.mustBackoff = sleep(backoffSeconds * 1000, signal));
                        await this.mustBackoff;
                        if (this.mustBackoff === limiter) {
                            this.mustBackoff = null;
                        }
                        continue;
                    }
                    else {
                        // we don't know how to parse this error, so we do nothing, I guess?
                    }
                }
                return result;
            }
        }
    }
}
exports.default = RateLimiter;
//# sourceMappingURL=rate-limiter.js.map