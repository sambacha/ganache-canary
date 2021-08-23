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
var _hdKey, _randomRng, _randomBytes, _initializeAccounts, _lockAccount;
Object.defineProperty(exports, "__esModule", { value: true });
const ethereum_utils_1 = require("@ganache/ethereum-utils");
const utils_1 = require("@ganache/utils");
const ethereumjs_util_1 = require("ethereumjs-util");
const secp256k1_1 = __importDefault(require("secp256k1"));
const bip39_1 = require("bip39");
const hdkey_1 = __importDefault(require("hdkey"));
const seedrandom_1 = require("seedrandom");
const crypto_1 = __importDefault(require("crypto"));
const keccak_1 = __importDefault(require("keccak"));
const fs_1 = require("fs");
const ethereum_address_1 = require("@ganache/ethereum-address");
//#region Constants
const SCRYPT_PARAMS = {
    dklen: 32,
    n: 1024,
    p: 8,
    r: 1
};
const CIPHER = "aes-128-ctr";
const scrypt = (...args) => {
    return new Promise((resolve, reject) => {
        crypto_1.default.scrypt.call(crypto_1.default, ...args, (err, derivedKey) => {
            if (err) {
                return void reject(err);
            }
            return resolve(derivedKey);
        });
    });
};
const uncompressedPublicKeyToAddress = (uncompressedPublicKey) => {
    const compresedPublicKey = secp256k1_1.default
        .publicKeyConvert(uncompressedPublicKey, false)
        .slice(1);
    const hasher = keccak_1.default("keccak256");
    hasher._state.absorb(compresedPublicKey);
    return ethereum_address_1.Address.from(hasher.digest().slice(-20));
};
const asUUID = (uuid) => {
    return `${uuid.toString("hex", 0, 4)}-${uuid.toString("hex", 4, 6)}-${uuid.toString("hex", 6, 8)}-${uuid.toString("hex", 8, 10)}-${uuid.toString("hex", 10)}`;
};
class Wallet {
    constructor(opts) {
        this.knownAccounts = new Set();
        this.encryptedKeyFiles = new Map();
        this.unlockedAccounts = new Map();
        this.lockTimers = new Map();
        _hdKey.set(this, void 0);
        _randomRng.set(this, void 0);
        _randomBytes.set(this, (length) => {
            // Since this is a mock RPC library, the rng doesn't need to be
            // cryptographically secure, and determinism is desired.
            const buf = Buffer.allocUnsafe(length);
            const rand = __classPrivateFieldGet(this, _randomRng);
            for (let i = 0; i < length; i++) {
                buf[i] = (rand() * 256) | 0; // generates a random number from 0 to 255
            }
            return buf;
        });
        _initializeAccounts.set(this, (options) => {
            // convert a potentially fractional balance of Ether to WEI
            const balanceParts = options.defaultBalance.toString().split(".", 2);
            const significand = BigInt(balanceParts[0]);
            const fractionalStr = balanceParts[1] || "0";
            const fractional = BigInt(fractionalStr);
            const magnitude = 10n ** BigInt(fractionalStr.length);
            const defaultBalanceInWei = utils_1.WEI * significand + fractional * (utils_1.WEI / magnitude);
            const etherInWei = utils_1.Quantity.from(defaultBalanceInWei);
            let accounts;
            let givenAccounts = options.accounts;
            let accountsLength;
            if (givenAccounts && (accountsLength = givenAccounts.length) !== 0) {
                const hdKey = __classPrivateFieldGet(this, _hdKey);
                const hdPath = options.hdPath;
                accounts = Array(accountsLength);
                for (let i = 0; i < accountsLength; i++) {
                    const account = givenAccounts[i];
                    const secretKey = account.secretKey;
                    let privateKey;
                    let address;
                    if (!secretKey) {
                        const acct = hdKey.derive(hdPath + i);
                        address = uncompressedPublicKeyToAddress(acct.publicKey);
                        privateKey = utils_1.Data.from(acct.privateKey);
                        accounts[i] = Wallet.createAccount(utils_1.Quantity.from(account.balance), privateKey, address);
                    }
                    else {
                        privateKey = utils_1.Data.from(secretKey);
                        const a = (accounts[i] = Wallet.createAccountFromPrivateKey(privateKey));
                        a.balance = utils_1.Quantity.from(account.balance);
                    }
                }
            }
            else {
                const numberOfAccounts = options.totalAccounts;
                if (numberOfAccounts != null) {
                    accounts = Array(numberOfAccounts);
                    const hdPath = options.hdPath;
                    const hdKey = __classPrivateFieldGet(this, _hdKey);
                    for (let index = 0; index < numberOfAccounts; index++) {
                        const acct = hdKey.derive(hdPath + index);
                        const address = uncompressedPublicKeyToAddress(acct.publicKey);
                        const privateKey = utils_1.Data.from(acct.privateKey);
                        accounts[index] = Wallet.createAccount(etherInWei, privateKey, address);
                    }
                }
            }
            return accounts;
        });
        _lockAccount.set(this, (lowerAddress) => {
            this.lockTimers.delete(lowerAddress);
            this.unlockedAccounts.delete(lowerAddress);
            return true;
        });
        __classPrivateFieldSet(this, _hdKey, hdkey_1.default.fromMasterSeed(bip39_1.mnemonicToSeedSync(opts.mnemonic, null)));
        // create a RNG from our initial starting conditions (opts.mnemonic)
        __classPrivateFieldSet(this, _randomRng, seedrandom_1.alea("ganache " + opts.mnemonic));
        const initialAccounts = (this.initialAccounts = __classPrivateFieldGet(this, _initializeAccounts).call(this, opts));
        const l = initialAccounts.length;
        const knownAccounts = this.knownAccounts;
        const unlockedAccounts = this.unlockedAccounts;
        //#region Unlocked Accounts
        const givenUnlockedAccounts = opts.unlockedAccounts;
        if (givenUnlockedAccounts) {
            const ul = givenUnlockedAccounts.length;
            for (let i = 0; i < ul; i++) {
                let arg = givenUnlockedAccounts[i];
                let address;
                switch (typeof arg) {
                    case "string":
                        // `toLowerCase` so we handle uppercase `0X` formats
                        const addressOrIndex = arg.toLowerCase();
                        if (addressOrIndex.indexOf("0x") === 0) {
                            address = addressOrIndex;
                            break;
                        }
                        else {
                            // try to convert the arg string to a number.
                            // don't use parseInt because strings like `"123abc"` parse
                            // to `123`, and there is probably an error on the user's side we'd
                            // want to uncover.
                            const index = arg - 0;
                            // if we don't have a valid number, or the number isn't a valid JS
                            // integer (no bigints or decimals, please), throw an error.
                            if (!Number.isSafeInteger(index)) {
                                throw new Error(`Invalid value in wallet.unlockedAccounts: ${arg}`);
                            }
                            arg = index;
                            // not `break`ing here because I want this to fall through to the
                            //  `"number"` case below.
                            // Refactor it if you want.
                            // break; // no break, please.
                        }
                    case "number":
                        const account = initialAccounts[arg];
                        if (account == null) {
                            throw new Error(`Account at index ${arg} not found. Max index available is ${l - 1}.`);
                        }
                        address = account.address.toString().toLowerCase();
                        break;
                    default:
                        throw new Error(`Invalid value specified in unlocked_accounts`);
                }
                if (unlockedAccounts.has(address))
                    continue;
                // if we don't have the secretKey for an account we use `null`
                unlockedAccounts.set(address, null);
            }
        }
        //#endregion
        //#region Configure Known + Unlocked Accounts
        const accountsCache = (this.addresses = Array(l));
        for (let i = 0; i < l; i++) {
            const account = initialAccounts[i];
            const address = account.address;
            const strAddress = address.toString();
            accountsCache[i] = strAddress;
            knownAccounts.add(strAddress);
            // if the `secure` option has been set do NOT add these accounts to the
            // unlockedAccounts, unless the account was already added to
            // unlockedAccounts, in which case we need to add the account's private
            // key.
            if (opts.secure && !unlockedAccounts.has(strAddress))
                continue;
            unlockedAccounts.set(strAddress, account.privateKey);
        }
        //#endregion
        //#region save accounts to disk
        if (opts.accountKeysPath != null) {
            const fileData = {
                addresses: {},
                private_keys: {}
            };
            unlockedAccounts.forEach((privateKey, address) => {
                fileData.addresses[address] = address;
                fileData.private_keys[address] = privateKey;
            });
            // WARNING: Do not turn this to an async method without
            // making a Wallet.initialize() function and calling it via
            // Provider.initialize(). No async methods in constructors.
            // writeFileSync here is acceptable.
            fs_1.writeFileSync(opts.accountKeysPath, JSON.stringify(fileData));
        }
        //#endregion
    }
    async encrypt(privateKey, passphrase) {
        const random = __classPrivateFieldGet(this, _randomBytes).call(this, 32 + 16 + 16);
        const salt = random.slice(0, 32); // first 32 bytes
        const iv = random.slice(32, 32 + 16); // next 16 bytes
        const uuid = random.slice(32 + 16); // last 16 bytes
        const derivedKey = await scrypt(passphrase, salt, SCRYPT_PARAMS.dklen, {
            ...SCRYPT_PARAMS,
            N: SCRYPT_PARAMS.n
        });
        const cipher = crypto_1.default.createCipheriv(CIPHER, derivedKey.slice(0, 16), iv);
        const ciphertext = Buffer.concat([
            cipher.update(privateKey.toBuffer()),
            cipher.final()
        ]);
        const mac = keccak_1.default("keccak256")
            .update(Buffer.concat([derivedKey.slice(16, 32), ciphertext]))
            .digest();
        return {
            crypto: {
                cipher: CIPHER,
                ciphertext: utils_1.Data.from(ciphertext),
                cipherparams: {
                    iv: utils_1.Data.from(iv)
                },
                kdf: "scrypt",
                kdfParams: {
                    ...SCRYPT_PARAMS,
                    salt: utils_1.Data.from(salt)
                },
                mac: utils_1.Data.from(mac)
            },
            id: asUUID(uuid),
            version: 3
        };
    }
    async decrypt(keyfile, passphrase) {
        const crypt = keyfile.crypto;
        if (crypt.cipher !== CIPHER) {
            throw new Error(`keyfile cypher must be "${CIPHER}"`);
        }
        if (crypt.kdf !== "scrypt") {
            throw new Error(`keyfile kdf must be "script"`);
        }
        const kdfParams = crypt.kdfParams;
        const salt = kdfParams.salt;
        const mac = crypt.mac;
        const ciphertext = crypt.ciphertext.toBuffer();
        let derivedKey;
        let localMac;
        if (passphrase != null) {
            try {
                derivedKey = await scrypt(passphrase, salt.toBuffer(), kdfParams.dklen, { ...kdfParams, N: kdfParams.n });
                localMac = keccak_1.default("keccak256")
                    .update(Buffer.concat([derivedKey.slice(16, 32), ciphertext]))
                    .digest();
            }
            catch {
                localMac = null;
            }
        }
        if (!localMac || !mac.toBuffer().equals(localMac)) {
            throw new Error("could not decrypt key with given password");
        }
        const decipher = crypto_1.default.createDecipheriv(crypt.cipher, derivedKey.slice(0, 16), crypt.cipherparams.iv.toBuffer());
        const plaintext = decipher.update(ciphertext);
        return plaintext;
    }
    static createAccount(balance, privateKey, address) {
        const account = new ethereum_utils_1.Account(address);
        account.privateKey = privateKey;
        account.balance = balance;
        return account;
    }
    static createAccountFromPrivateKey(privateKey) {
        const address = ethereum_address_1.Address.from(ethereumjs_util_1.privateToAddress(privateKey.toBuffer()));
        const account = new ethereum_utils_1.Account(address);
        account.privateKey = privateKey;
        return account;
    }
    createRandomAccount() {
        // create some seeded deterministic psuedo-randomness based on the chain's
        // initial starting conditions
        const seed = __classPrivateFieldGet(this, _randomBytes).call(this, 128);
        const acct = hdkey_1.default.fromMasterSeed(seed);
        const address = uncompressedPublicKeyToAddress(acct.publicKey);
        const privateKey = utils_1.Data.from(acct.privateKey);
        return Wallet.createAccount(utils_1.RPCQUANTITY_ZERO, privateKey, address);
    }
    async unlockAccount(lowerAddress, passphrase, duration) {
        const encryptedKeyFile = this.encryptedKeyFiles.get(lowerAddress);
        if (encryptedKeyFile == null) {
            return false;
        }
        const secretKey = await this.decrypt(encryptedKeyFile, passphrase);
        const existingTimer = this.lockTimers.get(lowerAddress);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        // a duration <= 0 will remain unlocked
        const durationMs = (duration * 1000) | 0;
        if (durationMs > 0) {
            const timeout = setTimeout(__classPrivateFieldGet(this, _lockAccount), durationMs, lowerAddress);
            utils_1.unref(timeout);
            this.lockTimers.set(lowerAddress, timeout);
        }
        this.unlockedAccounts.set(lowerAddress, utils_1.Data.from(secretKey));
        return true;
    }
    async unlockUnknownAccount(lowerAddress, duration) {
        if (this.unlockedAccounts.has(lowerAddress)) {
            // already unlocked, return `false` since we didn't do anything
            return false;
        }
        // if we "know" about this account, it cannot be unlocked this way
        if (this.knownAccounts.has(lowerAddress)) {
            throw new Error("cannot unlock known/personal account");
        }
        // a duration <= 0 will remain unlocked
        const durationMs = (duration * 1000) | 0;
        if (durationMs > 0) {
            const timeout = setTimeout(__classPrivateFieldGet(this, _lockAccount), durationMs, lowerAddress);
            utils_1.unref(timeout);
            this.lockTimers.set(lowerAddress, timeout);
        }
        // otherwise, unlock it!
        this.unlockedAccounts.set(lowerAddress, null);
        return true;
    }
    lockAccount(lowerAddress) {
        if (!this.unlockedAccounts.has(lowerAddress))
            return false;
        clearTimeout(this.lockTimers.get(lowerAddress));
        return __classPrivateFieldGet(this, _lockAccount).call(this, lowerAddress);
    }
}
exports.default = Wallet;
_hdKey = new WeakMap(), _randomRng = new WeakMap(), _randomBytes = new WeakMap(), _initializeAccounts = new WeakMap(), _lockAccount = new WeakMap();
//# sourceMappingURL=wallet.js.map