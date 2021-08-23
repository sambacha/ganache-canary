"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
var _miningLock, _minerEnabled, _messagePoolLock, _miningTimeoutLock, _database;
Object.defineProperty(exports, "__esModule", { value: true });
const tipset_1 = require("./things/tipset");
const block_header_1 = require("./things/block-header");
const cid_1 = require("./things/cid");
const root_cid_1 = require("./things/root-cid");
const utils_1 = require("@ganache/utils");
const emittery_1 = __importDefault(require("emittery"));
const deal_info_1 = require("./things/deal-info");
const storage_deal_status_1 = require("./types/storage-deal-status");
const ipfs_server_1 = __importDefault(require("./ipfs-server"));
const ipld_dag_cbor_1 = __importDefault(require("ipld-dag-cbor"));
const query_offer_1 = require("./things/query-offer");
const ticket_1 = require("./things/ticket");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ipfs_1 = require("ipfs");
const account_1 = require("./things/account");
const database_1 = __importDefault(require("./database"));
const tipset_manager_1 = __importDefault(require("./data-managers/tipset-manager"));
const block_header_manager_1 = __importDefault(require("./data-managers/block-header-manager"));
const signed_message_1 = require("./things/signed-message");
const address_1 = require("./things/address");
const signature_1 = require("./things/signature");
const sig_type_1 = require("./things/sig-type");
const async_sema_1 = require("async-sema");
const message_manager_1 = __importDefault(require("./data-managers/message-manager"));
const block_messages_manager_1 = __importDefault(require("./data-managers/block-messages-manager"));
const block_messages_1 = require("./things/block-messages");
const account_manager_1 = __importDefault(require("./data-managers/account-manager"));
const private_key_manager_1 = __importDefault(require("./data-managers/private-key-manager"));
const gas_1 = require("./gas");
const message_1 = require("./message");
const deal_info_manager_1 = __importDefault(require("./data-managers/deal-info-manager"));
const bls = __importStar(require("noble-bls12-381"));
// Reference implementation: https://git.io/JtEVW
const BurntFundsAddress = address_1.Address.fromId(99, true);
class Blockchain extends emittery_1.default.Typed {
    constructor(options) {
        super();
        _miningLock.set(this, void 0);
        _minerEnabled.set(this, void 0);
        _messagePoolLock.set(this, void 0);
        _miningTimeoutLock.set(this, void 0);
        _database.set(this, void 0);
        this.options = options;
        this.rng = new utils_1.RandomNumberGenerator(this.options.wallet.seed);
        this.miner = address_1.Address.fromId(0, false, true);
        this.messagePool = [];
        __classPrivateFieldSet(this, _messagePoolLock, new async_sema_1.Sema(1));
        this.ready = false;
        this.stopped = false;
        // Create the IPFS server
        this.ipfsServer = new ipfs_server_1.default(this.options.chain);
        this.miningTimeout = null;
        __classPrivateFieldSet(this, _miningTimeoutLock, new async_sema_1.Sema(1));
        // to prevent us from stopping while mining or mining
        // multiple times simultaneously
        __classPrivateFieldSet(this, _miningLock, new async_sema_1.Sema(1));
        __classPrivateFieldSet(this, _minerEnabled, this.options.miner.mine);
        // We set these to null since they get initialized in
        // an async callback below. We could ignore the TS error,
        // but this is more technically correct (and check for not null later)
        this.tipsetManager = null;
        this.blockHeaderManager = null;
        this.accountManager = null;
        this.privateKeyManager = null;
        this.signedMessagesManager = null;
        this.blockMessagesManager = null;
        this.dealInfoManager = null;
        __classPrivateFieldSet(this, _database, new database_1.default(options.database));
    }
    get minerEnabled() {
        return __classPrivateFieldGet(this, _minerEnabled);
    }
    // This is primarily used by Ganache UI to support workspaces
    get dbDirectory() {
        return __classPrivateFieldGet(this, _database).directory;
    }
    async initialize() {
        await __classPrivateFieldGet(this, _database).initialize();
        this.blockHeaderManager = await block_header_manager_1.default.initialize(__classPrivateFieldGet(this, _database).blocks);
        this.tipsetManager = await tipset_manager_1.default.initialize(__classPrivateFieldGet(this, _database).tipsets, this.blockHeaderManager);
        this.privateKeyManager = await private_key_manager_1.default.initialize(__classPrivateFieldGet(this, _database).privateKeys);
        this.accountManager = await account_manager_1.default.initialize(__classPrivateFieldGet(this, _database).accounts, this.privateKeyManager, __classPrivateFieldGet(this, _database));
        this.signedMessagesManager = await message_manager_1.default.initialize(__classPrivateFieldGet(this, _database).signedMessages);
        this.blockMessagesManager = await block_messages_manager_1.default.initialize(__classPrivateFieldGet(this, _database).blockMessages, this.signedMessagesManager);
        this.dealInfoManager = await deal_info_manager_1.default.initialize(__classPrivateFieldGet(this, _database).deals, __classPrivateFieldGet(this, _database).dealExpirations);
        const controllableAccounts = await this.accountManager.getControllableAccounts();
        if (controllableAccounts.length === 0) {
            for (let i = 0; i < this.options.wallet.totalAccounts; i++) {
                await this.accountManager.putAccount(account_1.Account.random(this.options.wallet.defaultBalance, this.rng));
            }
        }
        const recordedGenesisTipset = await this.tipsetManager.getTipsetWithBlocks(0);
        if (recordedGenesisTipset === null) {
            // Create genesis tipset
            const genesisBlock = new block_header_1.BlockHeader({
                ticket: new ticket_1.Ticket({
                    // Reference implementation https://git.io/Jt31s
                    vrfProof: this.rng.getBuffer(32)
                }),
                parents: [
                    // Both lotus and lotus-devnet always have the Filecoin genesis CID
                    // hardcoded here. Reference implementation: https://git.io/Jt3oK
                    new root_cid_1.RootCID({
                        "/": "bafyreiaqpwbbyjo4a42saasj36kkrpv4tsherf2e7bvezkert2a7dhonoi"
                    })
                ]
            });
            const genesisTipset = new tipset_1.Tipset({
                blocks: [genesisBlock],
                height: 0
            });
            this.tipsetManager.earliest = genesisTipset; // initialize earliest
            await this.tipsetManager.putTipset(genesisTipset); // sets latest
            await __classPrivateFieldGet(this, _database).db.put("latest-tipset", utils_1.uintToBuffer(0));
        }
        else {
            this.tipsetManager.earliest = recordedGenesisTipset; // initialize earliest
            const data = await __classPrivateFieldGet(this, _database).db.get("latest-tipset");
            const height = utils_1.Quantity.from(data).toNumber();
            const latestTipset = await this.tipsetManager.getTipsetWithBlocks(height);
            this.tipsetManager.latest = latestTipset; // initialize latest
        }
        await this.ipfsServer.start(__classPrivateFieldGet(this, _database).directory);
        // Fire up the miner if necessary
        if (this.minerEnabled && this.options.miner.blockTime > 0) {
            await this.enableMiner();
        }
        // Get this party started!
        this.ready = true;
        this.emit("ready");
        // Don't log until things are all ready
        this.logLatestTipset();
    }
    async waitForReady() {
        return new Promise(resolve => {
            if (this.ready) {
                resolve(void 0);
            }
            else {
                this.on("ready", resolve);
            }
        });
    }
    /**
     * Gracefully shuts down the blockchain service and all of its dependencies.
     */
    async stop() {
        // Don't try to stop if we're already stopped
        if (this.stopped) {
            return;
        }
        this.stopped = true;
        // make sure we wait until other stuff is finished,
        // prevent it from starting up again by not releasing
        await __classPrivateFieldGet(this, _miningLock).acquire();
        await __classPrivateFieldGet(this, _messagePoolLock).acquire();
        await __classPrivateFieldGet(this, _miningTimeoutLock).acquire();
        if (this.miningTimeout) {
            clearTimeout(this.miningTimeout);
        }
        if (this.ipfsServer) {
            await this.ipfsServer.stop();
        }
        if (__classPrivateFieldGet(this, _database)) {
            await __classPrivateFieldGet(this, _database).close();
        }
    }
    get ipfs() {
        return this.ipfsServer.node;
    }
    async intervalMine(mine = true) {
        await __classPrivateFieldGet(this, _miningTimeoutLock).acquire();
        if (mine) {
            await this.mineTipset();
        }
        this.miningTimeout = setTimeout(this.intervalMine.bind(this), this.options.miner.blockTime * 1000);
        utils_1.unref(this.miningTimeout);
        __classPrivateFieldGet(this, _miningTimeoutLock).release();
    }
    async enableMiner() {
        __classPrivateFieldSet(this, _minerEnabled, true);
        this.emit("minerEnabled", true);
        if (this.options.miner.blockTime > 0) {
            await this.intervalMine(false);
        }
    }
    async disableMiner() {
        __classPrivateFieldSet(this, _minerEnabled, false);
        this.emit("minerEnabled", false);
        await __classPrivateFieldGet(this, _miningTimeoutLock).acquire();
        if (this.miningTimeout) {
            clearTimeout(this.miningTimeout);
            this.miningTimeout = null;
        }
        __classPrivateFieldGet(this, _miningTimeoutLock).release();
    }
    genesisTipset() {
        if (!this.tipsetManager || !this.tipsetManager.earliest) {
            throw new Error("Could not get genesis tipset due to not being initialized yet");
        }
        return this.tipsetManager.earliest;
    }
    latestTipset() {
        if (!this.tipsetManager || !this.tipsetManager.latest) {
            throw new Error("Could not get latest tipset due to not being initialized yet");
        }
        return this.tipsetManager.latest;
    }
    // Reference Implementation: https://git.io/JtWnM
    async push(message, spec) {
        await this.waitForReady();
        if (message.method !== 0) {
            throw new Error(`Unsupported Method (${message.method}); only value transfers (Method: 0) are supported in Ganache.`);
        }
        if (message.nonce !== 0) {
            throw new Error(`MpoolPushMessage expects message nonce to be 0, was ${message.nonce}`);
        }
        // the reference implementation doesn't allow the address to be
        // the ID protocol, but we're only going to support BLS for now
        if (address_1.Address.parseProtocol(message.from) === address_1.AddressProtocol.ID ||
            address_1.Address.parseProtocol(message.from) === address_1.AddressProtocol.Unknown) {
            throw new Error("The From address is an invalid protocol; please use a BLS or SECP256K1 address.");
        }
        if (address_1.Address.parseProtocol(message.to) === address_1.AddressProtocol.ID ||
            address_1.Address.parseProtocol(message.to) === address_1.AddressProtocol.Unknown) {
            throw new Error("The To address is an invalid protocol; please use a BLS or SECP256K1 address.");
        }
        gas_1.fillGasInformation(message, spec);
        try {
            await __classPrivateFieldGet(this, _messagePoolLock).acquire();
            const account = await this.accountManager.getAccount(message.from);
            const pendingMessagesForAccount = this.messagePool.filter(queuedMessage => queuedMessage.message.from === message.from);
            if (pendingMessagesForAccount.length === 0) {
                // account.nonce already stores the "next nonce"
                // don't add more to it
                message.nonce = account.nonce;
            }
            else {
                // in this case, we have messages in the pool with
                // already incremented nonces (account.nonce only
                // increments when the block is mined). this will
                // generate a nonce greater than any other nonce
                const nonceFromPendingMessages = pendingMessagesForAccount.reduce((nonce, m) => {
                    return Math.max(nonce, m.message.nonce);
                }, account.nonce);
                message.nonce = nonceFromPendingMessages + 1;
            }
            // check if enough funds
            const messageBalanceRequired = message.gasFeeCap * BigInt(message.gasLimit) + message.value;
            const pendingBalanceRequired = pendingMessagesForAccount.reduce((balanceSpent, m) => {
                return (balanceSpent +
                    m.message.gasFeeCap * BigInt(m.message.gasLimit) +
                    m.message.value);
            }, 0n);
            const totalRequired = messageBalanceRequired + pendingBalanceRequired;
            if (account.balance.value < totalRequired) {
                throw new Error(`mpool push: not enough funds: ${account.balance.value - pendingBalanceRequired} < ${messageBalanceRequired}`);
            }
            // sign the message
            const signature = await account.address.signMessage(message);
            const signedMessage = new signed_message_1.SignedMessage({
                Message: message.serialize(),
                Signature: new signature_1.Signature({
                    type: sig_type_1.SigType.SigTypeBLS,
                    data: signature
                }).serialize()
            });
            // add to pool
            await this.pushSigned(signedMessage, false);
            __classPrivateFieldGet(this, _messagePoolLock).release();
            return signedMessage;
        }
        catch (e) {
            __classPrivateFieldGet(this, _messagePoolLock).release();
            throw e;
        }
    }
    async pushSigned(signedMessage, acquireLock = true) {
        const error = await message_1.checkMessage(signedMessage);
        if (error) {
            throw error;
        }
        try {
            if (acquireLock) {
                await __classPrivateFieldGet(this, _messagePoolLock).acquire();
            }
            this.messagePool.push(signedMessage);
            if (acquireLock) {
                __classPrivateFieldGet(this, _messagePoolLock).release();
            }
            if (this.minerEnabled && this.options.miner.blockTime === 0) {
                // we should instamine this message
                // purposely not awaiting on this as we'll
                // deadlock for Filecoin.MpoolPushMessage calls
                this.mineTipset();
            }
            return new root_cid_1.RootCID({
                root: signedMessage.cid
            });
        }
        catch (e) {
            if (acquireLock) {
                __classPrivateFieldGet(this, _messagePoolLock).release();
            }
            throw e;
        }
    }
    // Reference implementation: https://git.io/Jt2lh
    // I don't believe the reference implementation translates very
    // easily to our architecture. The implementation below mimics
    // the desired behavior
    async mpoolClear(local) {
        await this.waitForReady();
        try {
            await __classPrivateFieldGet(this, _messagePoolLock).acquire();
            if (local) {
                this.messagePool = [];
            }
            else {
                const localAccounts = await this.accountManager.getControllableAccounts();
                const localAddressStrings = localAccounts.map(account => account.address.value);
                this.messagePool = this.messagePool.filter(signedMessage => {
                    return localAddressStrings.includes(signedMessage.message.from);
                });
            }
            __classPrivateFieldGet(this, _messagePoolLock).release();
        }
        catch (e) {
            __classPrivateFieldGet(this, _messagePoolLock).release();
            throw e;
        }
    }
    // Reference implementation: https://git.io/Jt28F
    // The below implementation makes the assumption that
    // it's not possible for the user to request a valid
    // tipset key that is greater than the message pools
    // pending height. This just cannot happen with the
    // current design of Ganache. I believe this scenario
    // would happen in other networks because of syncing
    // issues preventing the state to always be at the
    // network head.
    async mpoolPending() {
        await this.waitForReady();
        try {
            await __classPrivateFieldGet(this, _messagePoolLock).acquire();
            // this does a pseudo clone so that what we send
            // won't change after the lock is released but before
            // it goes out the api
            const pendingMessages = this.messagePool.map(sm => new signed_message_1.SignedMessage(sm.serialize()));
            __classPrivateFieldGet(this, _messagePoolLock).release();
            return pendingMessages;
        }
        catch (e) {
            __classPrivateFieldGet(this, _messagePoolLock).release();
            throw e;
        }
    }
    // Note that this is naive - it always assumes the first block in the
    // previous tipset is the parent of the new blocks.
    async mineTipset(numNewBlocks = 1) {
        await this.waitForReady();
        try {
            await __classPrivateFieldGet(this, _miningLock).acquire();
            // let's grab the messages going into the next tipset
            // immediately and clear the message pool for the next tipset
            let nextMessagePool;
            try {
                await __classPrivateFieldGet(this, _messagePoolLock).acquire();
                nextMessagePool = [].concat(this.messagePool);
                this.messagePool = [];
                __classPrivateFieldGet(this, _messagePoolLock).release();
            }
            catch (e) {
                __classPrivateFieldGet(this, _messagePoolLock).release();
                throw e;
            }
            const previousTipset = this.latestTipset();
            const newTipsetHeight = previousTipset.height + 1;
            const newBlocks = [];
            for (let i = 0; i < numNewBlocks; i++) {
                newBlocks.push(new block_header_1.BlockHeader({
                    miner: this.miner,
                    parents: [previousTipset.cids[0]],
                    height: newTipsetHeight,
                    // Determined by interpreting the description of `weight`
                    // as an accumulating weight of win counts (which default to 1)
                    // See the description here: https://spec.filecoin.io/#section-glossary.weight
                    parentWeight: BigInt(previousTipset.blocks[0].electionProof.winCount) +
                        previousTipset.blocks[0].parentWeight
                }));
            }
            if (nextMessagePool.length > 0) {
                const successfulMessages = [];
                const blsSignatures = [];
                for (const signedMessage of nextMessagePool) {
                    const { from, to, value } = signedMessage.message;
                    const baseFee = gas_1.getBaseFee();
                    if (baseFee !== 0) {
                        const successful = await this.accountManager.transferFunds(from, BurntFundsAddress.value, gas_1.getMinerFee(signedMessage.message));
                        if (!successful) {
                            // While we should have checked this when the message was sent,
                            // we double check here just in case
                            const fromAccount = await this.accountManager.getAccount(from);
                            console.warn(`Could not burn the base fee of ${baseFee} attoFIL from address ${from} due to lack of funds. ${fromAccount.balance.value} attoFIL available`);
                            continue;
                        }
                    }
                    // send mining funds
                    let successful = await this.accountManager.transferFunds(from, this.miner.value, gas_1.getMinerFee(signedMessage.message));
                    if (!successful) {
                        // While we should have checked this when the message was sent,
                        // we double check here just in case
                        const fromAccount = await this.accountManager.getAccount(from);
                        console.warn(`Could not transfer the mining fees of ${gas_1.getMinerFee(signedMessage.message)} attoFIL from address ${from} due to lack of funds. ${fromAccount.balance.value} attoFIL available`);
                        continue;
                    }
                    successful = await this.accountManager.transferFunds(from, to, value);
                    if (!successful) {
                        // While we should have checked this when the message was sent,
                        // we double check here just in case
                        const fromAccount = await this.accountManager.getAccount(from);
                        console.warn(`Could not transfer ${value} attoFIL from address ${from} to address ${to} due to lack of funds. ${fromAccount.balance.value} attoFIL available`);
                        // do not revert miner transfer as the miner attempted to mine
                        continue;
                    }
                    this.accountManager.incrementNonce(from);
                    successfulMessages.push(signedMessage);
                    if (signedMessage.signature.type === sig_type_1.SigType.SigTypeBLS) {
                        blsSignatures.push(signedMessage.signature.data);
                    }
                }
                if (blsSignatures.length > 0) {
                    newBlocks[0].blsAggregate = new signature_1.Signature({
                        type: sig_type_1.SigType.SigTypeBLS,
                        data: Buffer.from(bls.aggregateSignatures(blsSignatures).buffer)
                    });
                }
                else {
                    newBlocks[0].blsAggregate = new signature_1.Signature({
                        type: sig_type_1.SigType.SigTypeBLS,
                        data: Buffer.from([])
                    });
                }
                await this.blockMessagesManager.putBlockMessages(newBlocks[0].cid, block_messages_1.BlockMessages.fromSignedMessages(successfulMessages));
            }
            const newTipset = new tipset_1.Tipset({
                blocks: newBlocks,
                height: newTipsetHeight
            });
            await this.tipsetManager.putTipset(newTipset);
            await __classPrivateFieldGet(this, _database).db.put("latest-tipset", utils_1.uintToBuffer(newTipsetHeight));
            // Advance the state of all deals in process.
            const currentDeals = await this.dealInfoManager.getDeals();
            const inProcessDeals = currentDeals.filter(deal => storage_deal_status_1.dealIsInProcess(deal.state));
            for (const deal of inProcessDeals) {
                deal.advanceState();
                await this.dealInfoManager.updateDealInfo(deal);
                this.emit("dealUpdate", deal);
            }
            // Process deal expirations
            const activeDeals = currentDeals.filter(deal => deal.state === storage_deal_status_1.StorageDealStatus.Active);
            for (const deal of activeDeals) {
                const expirationTipset = await this.dealInfoManager.getDealExpiration(deal.proposalCid);
                if (expirationTipset !== null && newTipset.height > expirationTipset) {
                    deal.state = storage_deal_status_1.StorageDealStatus.Expired;
                    await this.dealInfoManager.updateDealInfo(deal);
                    this.emit("dealUpdate", deal);
                }
            }
            this.logLatestTipset();
            this.emit("tipset", newTipset);
            __classPrivateFieldGet(this, _miningLock).release();
        }
        catch (e) {
            __classPrivateFieldGet(this, _miningLock).release();
            throw e;
        }
    }
    async hasLocal(cid) {
        if (!this.ipfsServer.node) {
            return false;
        }
        try {
            // This stat will fail if the object doesn't exist.
            await this.ipfsServer.node.object.stat(cid, {
                timeout: 500 // Enforce a timeout; otherwise will hang if CID not found
            });
            return true;
        }
        catch (e) {
            return false;
        }
    }
    async getIPFSObjectSize(cid) {
        if (!this.ipfsServer.node) {
            return 0;
        }
        const stat = await this.ipfsServer.node.object.stat(cid, {
            timeout: 500 // Enforce a timeout; otherwise will hang if CID not found
        });
        return stat.CumulativeSize;
    }
    async downloadFile(cid, ref) {
        if (!this.ipfsServer.node) {
            throw new Error("IPFS server is not running");
        }
        const dirname = path_1.default.dirname(ref.path);
        let fileStream;
        try {
            try {
                if (!fs_1.default.existsSync(dirname)) {
                    await fs_1.default.promises.mkdir(dirname, { recursive: true });
                }
                fileStream = fs_1.default.createWriteStream(`${ref.path}.partial`, {
                    encoding: "binary"
                });
            }
            catch (e) {
                throw new Error(`Could not create file.\n  CID: ${cid}\n  Path: ${ref.path}\n  Error: ${e.toString()}`);
            }
            const chunks = this.ipfsServer.node.files.read(new ipfs_1.CID(cid), {
                timeout: 500 // Enforce a timeout; otherwise will hang if CID not found
            });
            for await (const chunk of chunks) {
                try {
                    await new Promise((resolve, reject) => {
                        const shouldContinue = fileStream.write(chunk, error => {
                            if (error) {
                                reject(error);
                            }
                            else {
                                if (shouldContinue) {
                                    resolve();
                                }
                                else {
                                    fileStream.once("drain", resolve);
                                }
                            }
                        });
                    });
                }
                catch (e) {
                    throw new Error(`Could not save file.\n  CID: ${cid}\n  Path: ${ref.path}\n  Error: ${e.toString()}`);
                }
            }
            await fs_1.default.promises.rename(`${ref.path}.partial`, ref.path);
        }
        finally {
            // @ts-ignore
            if (fileStream) {
                fileStream.close();
            }
        }
    }
    async startDeal(proposal) {
        await this.waitForReady();
        if (!proposal.wallet) {
            throw new Error("StartDealParams.Wallet not provided and is required to start a storage deal.");
        }
        // have to specify type since node types are not correct
        const account = await this.accountManager.getAccount(proposal.wallet.value);
        if (!account.address.privateKey) {
            throw new Error(`Invalid StartDealParams.Wallet provided. Ganache doesn't have the private key for account with address ${proposal.wallet.value}`);
        }
        const signature = await account.address.signProposal(proposal);
        const proposalRawCid = await ipld_dag_cbor_1.default.util.cid(signature.toString("hex"));
        const proposalCid = new cid_1.CID(proposalRawCid.toString());
        const currentDeals = await this.dealInfoManager.getDeals();
        let deal = new deal_info_1.DealInfo({
            proposalCid: new root_cid_1.RootCID({
                root: proposalCid
            }),
            state: storage_deal_status_1.StorageDealStatus.Validating,
            message: "",
            provider: this.miner,
            pieceCid: proposal.data.pieceCid,
            size: proposal.data.pieceSize ||
                (await this.getIPFSObjectSize(proposal.data.root.root.value)),
            pricePerEpoch: proposal.epochPrice,
            duration: proposal.minBlocksDuration,
            dealId: currentDeals.length + 1
        });
        // prepare future deal expiration
        const activeTipsetHeight = this.latestTipset().height + Object.keys(storage_deal_status_1.nextSuccessfulState).length - 1;
        const expirationTipsetHeight = activeTipsetHeight + deal.duration;
        await this.dealInfoManager.addDealInfo(deal, expirationTipsetHeight);
        this.emit("dealUpdate", deal);
        // If we're automining, mine a new block. Note that this will
        // automatically advance the deal to the active state.
        if (this.minerEnabled && this.options.miner.blockTime === 0) {
            while (deal.state !== storage_deal_status_1.StorageDealStatus.Active) {
                await this.mineTipset();
                deal = (await this.dealInfoManager.get(deal.proposalCid.root.value));
            }
        }
        // Subtract the cost from our current balance
        const totalPrice = BigInt(deal.pricePerEpoch) * BigInt(deal.duration);
        await this.accountManager.transferFunds(proposal.wallet.value, proposal.miner.value, totalPrice);
        return deal.proposalCid;
    }
    async createQueryOffer(rootCid) {
        await this.waitForReady();
        const size = await this.getIPFSObjectSize(rootCid.root.value);
        return new query_offer_1.QueryOffer({
            root: rootCid,
            size: size,
            miner: this.miner,
            minPrice: BigInt(size * 2) // This seems to be what powergate does
        });
    }
    async retrieve(retrievalOrder, ref) {
        await this.waitForReady();
        const hasLocal = await this.hasLocal(retrievalOrder.root.root.value);
        const account = await this.accountManager.getAccount(retrievalOrder.client.value);
        if (!account.address.privateKey) {
            throw new Error(`Invalid RetrievalOrder.Client provided. Ganache doesn't have the private key for account with address ${retrievalOrder.client}`);
        }
        if (!hasLocal) {
            throw new Error(`Object not found: ${retrievalOrder.root.root.value}`);
        }
        await this.downloadFile(retrievalOrder.root.root.value, ref);
        await this.accountManager.transferFunds(retrievalOrder.client.value, retrievalOrder.miner.value, retrievalOrder.total);
    }
    // Reference implementation: https://git.io/Jt7eQ
    async getTipsetFromKey(tipsetKey) {
        await this.waitForReady();
        if (!tipsetKey || tipsetKey.length === 0) {
            return this.tipsetManager.latest;
        }
        // Instead of using the `LoadTipSet` implementation
        // found in the reference implementation, we can greatly
        // simplify the process due to our current "a block can
        // only be part of one tipset". This is a special condition
        // of Ganache due to not dealing with a real network.
        for (const cid of tipsetKey) {
            const cidString = cid.root.value;
            const blockHeader = await this.blockHeaderManager.get(Buffer.from(cidString));
            if (blockHeader) {
                const tipset = await this.tipsetManager.getTipsetWithBlocks(blockHeader.height);
                if (tipset) {
                    return tipset;
                }
            }
        }
        throw new Error("Could not retrieve tipset from tipset key");
    }
    // Reference implementation: https://git.io/Jt7vk
    async getTipsetByHeight(height, tipsetKey) {
        await this.waitForReady();
        let tipset = await this.getTipsetFromKey(tipsetKey);
        // Reference implementation: https://git.io/Jt7vI
        if (height > tipset.height) {
            throw new Error("looking for tipset with height greater than start point");
        }
        if (height === tipset.height) {
            return tipset;
        }
        // The reference implementation then calls `cs.cindex.GetTipsetByHeight`
        // which is specific to their blockchain implementation of needing to
        // walk back different caches. The way ganache stores these currently
        // is much simpler, and we can fetch the tipset directly from the height
        tipset = await this.tipsetManager.getTipsetWithBlocks(height);
        if (tipset) {
            return tipset;
        }
        else {
            throw new Error("Could not find tipset with the provided height");
        }
    }
    async createAccount(protocol) {
        await this.waitForReady();
        const account = account_1.Account.random(0, this.rng, protocol);
        await this.accountManager.putAccount(account);
        return account;
    }
    logLatestTipset() {
        const date = new Date().toISOString();
        const tipset = this.latestTipset();
        this.options.logging.logger.log(`${date} INFO New heaviest tipset! [${tipset.cids[0].root.value}] (height=${tipset.height})`);
    }
}
exports.default = Blockchain;
_miningLock = new WeakMap(), _minerEnabled = new WeakMap(), _messagePoolLock = new WeakMap(), _miningTimeoutLock = new WeakMap(), _database = new WeakMap();
//# sourceMappingURL=blockchain.js.map