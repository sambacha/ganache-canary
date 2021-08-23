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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _options, _cleanupDirectory, _closed, _initialized, _rootStore, _cleanup;
Object.defineProperty(exports, "__esModule", { value: true });
const emittery_1 = __importDefault(require("emittery"));
const tmp_promise_1 = require("tmp-promise");
const levelup_1 = __importDefault(require("levelup"));
const leveldown = require("leveldown");
const sub = require("subleveldown");
const encode = require("encoding-down");
tmp_promise_1.setGracefulCleanup();
const tmpOptions = { prefix: "ganache_", unsafeCleanup: true };
const noop = () => Promise.resolve();
class Database extends emittery_1.default {
    /**
     * The Database handles the creation of the database, and all access to it.
     * Once the database has been fully initialized it will emit a `ready`
     * event.
     * @param options Supports one of two options: `db` (a leveldown compliant
     * store instance) or `dbPath` (the path to store/read the db instance)
     * @param blockchain
     */
    constructor(options) {
        super();
        _options.set(this, void 0);
        _cleanupDirectory.set(this, noop);
        _closed.set(this, false);
        this.directory = null;
        this.db = null;
        this.tipsets = null;
        this.blocks = null;
        this.accounts = null;
        this.privateKeys = null;
        this.signedMessages = null;
        this.blockMessages = null;
        this.deals = null;
        this.dealExpirations = null;
        _initialized.set(this, false);
        _rootStore.set(this, null);
        this.initialize = async () => {
            const levelupOptions = { valueEncoding: "binary" };
            const store = __classPrivateFieldGet(this, _options).db;
            let db;
            if (store) {
                __classPrivateFieldSet(this, _rootStore, encode(store, levelupOptions));
                // @ts-ignore - I get an error in ts-node that I don't get running ttsc:
                // Argument of type 'AbstractLevelDOWN<any, any>' is not assignable to parameter of type 'string'
                // But this error just doesn't make any sense. I'm just going to ignore the error
                db = levelup_1.default(__classPrivateFieldGet(this, _rootStore), {});
            }
            else {
                let directory = __classPrivateFieldGet(this, _options).dbPath;
                if (!directory) {
                    const dirInfo = await tmp_promise_1.dir(tmpOptions);
                    directory = dirInfo.path;
                    __classPrivateFieldSet(this, _cleanupDirectory, dirInfo.cleanup);
                    // don't continue if we closed while we were waiting for the dir
                    if (__classPrivateFieldGet(this, _closed))
                        return __classPrivateFieldGet(this, _cleanup).call(this);
                }
                this.directory = directory;
                // specify an empty `prefix` for browser-based leveldown (level-js)
                const leveldownOpts = { prefix: "" };
                const store = encode(leveldown(directory, leveldownOpts), levelupOptions);
                __classPrivateFieldSet(this, _rootStore, store);
                db = levelup_1.default(store, {});
            }
            // don't continue if we closed while we were waiting for the db
            if (__classPrivateFieldGet(this, _closed))
                return __classPrivateFieldGet(this, _cleanup).call(this);
            const open = db.open();
            this.db = db;
            await open;
            // don't continue if we closed while we were waiting for it to open
            if (__classPrivateFieldGet(this, _closed))
                return __classPrivateFieldGet(this, _cleanup).call(this);
            this.tipsets = sub(db, "t", levelupOptions);
            this.blocks = sub(db, "b", levelupOptions);
            this.accounts = sub(db, "a", levelupOptions);
            this.privateKeys = sub(db, "pk", levelupOptions);
            this.signedMessages = sub(db, "m", levelupOptions);
            this.blockMessages = sub(db, "bm", levelupOptions);
            this.deals = sub(db, "d", levelupOptions);
            this.dealExpirations = sub(db, "de", levelupOptions);
            __classPrivateFieldSet(this, _initialized, true);
            return this.emit("ready");
        };
        /**
         * Cleans up the database connections and our tmp directory.
         */
        _cleanup.set(this, async () => {
            const db = this.db;
            if (db) {
                await db.close();
                if (this.tipsets) {
                    await this.tipsets.close();
                }
                if (this.blocks) {
                    await this.blocks.close();
                }
                if (this.accounts) {
                    await this.accounts.close();
                }
                if (this.privateKeys) {
                    await this.privateKeys.close();
                }
                if (this.signedMessages) {
                    await this.signedMessages.close();
                }
                if (this.blockMessages) {
                    await this.blockMessages.close();
                }
                if (this.deals) {
                    await this.deals.close();
                }
                if (this.dealExpirations) {
                    await this.dealExpirations.close();
                }
            }
            return await __classPrivateFieldGet(this, _cleanupDirectory).call(this);
        });
        __classPrivateFieldSet(this, _options, options);
    }
    get initialized() {
        return __classPrivateFieldGet(this, _initialized);
    }
    /**
     * Call `batch` to batch `put` and `del` operations within the same
     * event loop tick of the provided function. All db operations within the
     * batch _must_ be executed synchronously.
     * @param fn Within this function's event loop tick, all `put` and
     * `del` database operations are applied in a single atomic operation. This
     * provides a single write call and if any individual put/del's fail the
     * entire operation fails and no modifications are made.
     * @returns a Promise that resolves to the return value
     * of the provided function.
     */
    batch(fn) {
        if (!this.initialized) {
            throw new Error("Could not call Database.batch as the database isn't initialized yet.");
        }
        const rootDb = __classPrivateFieldGet(this, _rootStore).db;
        const batch = this.db.batch();
        const originalPut = rootDb.put;
        const originalDel = rootDb.del;
        rootDb.put = batch.put.bind(batch);
        rootDb.del = batch.del.bind(batch);
        let prom;
        try {
            const ret = fn();
            // PSA: don't let vscode (or yourself) rewrite this to `await` the
            // `batch.write` call. The `finally` block needs to run _before_ the
            // write promise has resolved.
            prom = batch.write().then(() => ret);
        }
        finally {
            rootDb.put = originalPut;
            rootDb.del = originalDel;
        }
        return prom;
    }
    /**
     * Gracefully closes the database and cleans up the file system and waits for
     * it to fully shut down. Emits a `close` event once complete.
     * Note: only emits `close` once.
     */
    async close() {
        const wasClosed = __classPrivateFieldGet(this, _closed);
        __classPrivateFieldSet(this, _closed, true);
        await __classPrivateFieldGet(this, _cleanup).call(this);
        // only emit `close` once
        if (!wasClosed) {
            this.emit("close");
            return;
        }
    }
}
exports.default = Database;
_options = new WeakMap(), _cleanupDirectory = new WeakMap(), _closed = new WeakMap(), _initialized = new WeakMap(), _rootStore = new WeakMap(), _cleanup = new WeakMap();
//# sourceMappingURL=database.js.map