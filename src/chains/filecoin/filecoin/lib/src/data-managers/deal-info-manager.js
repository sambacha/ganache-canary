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
var _dealExpirations;
Object.defineProperty(exports, "__esModule", { value: true });
const manager_1 = __importDefault(require("./manager"));
const deal_info_1 = require("../things/deal-info");
const NOTFOUND = 404;
/**
 * TODO: (Issue ganache#868) This loads all Deal CIDs and
 * then all the deals themselves into memory. The downstream
 * consumers of this manager then filters them at every time
 * it's used (i.e. filters them by DealInfo.State).
 *
 * We'll need to rework this in the future. LevelDB has a
 * `createReadStream` method that could help with some of this;
 * but David M. thinks we'll also need to add another sublevel
 * that acts as an index for deal states.
 */
class DealInfoManager extends manager_1.default {
    constructor(base, dealExpirations) {
        super(base, deal_info_1.DealInfo);
        _dealExpirations.set(this, void 0);
        __classPrivateFieldSet(this, _dealExpirations, dealExpirations);
    }
    static async initialize(base, dealExpirations) {
        const manager = new DealInfoManager(base, dealExpirations);
        return manager;
    }
    async updateDealInfo(deal) {
        await super.set(deal.proposalCid.root.value, deal);
    }
    async addDealInfo(deal, expirationTipsetHeight) {
        await this.updateDealInfo(deal);
        const cids = await this.getDealCids();
        cids.push(deal.proposalCid.serialize());
        await this.putDealCids(cids);
        __classPrivateFieldGet(this, _dealExpirations).put(Buffer.from(deal.proposalCid.root.value), Buffer.from(`${expirationTipsetHeight}`));
    }
    async getDealCids() {
        try {
            const result = await this.base.get(DealInfoManager.Deals);
            return JSON.parse(result.toString());
        }
        catch (e) {
            if (e.status === NOTFOUND) {
                await this.base.put(DealInfoManager.Deals, Buffer.from(JSON.stringify([])));
                return [];
            }
            throw e;
        }
    }
    async getDeals() {
        const cids = await this.getDealCids();
        const deals = await Promise.all(cids.map(async (cid) => await super.get(cid["/"])));
        const cidsToKeep = [];
        const validDeals = [];
        for (let i = 0; i < deals.length; i++) {
            if (deals[i] !== null) {
                cidsToKeep.push(cids[i]);
                validDeals.push(deals[i]);
            }
        }
        if (cids.length !== cidsToKeep.length) {
            await this.putDealCids(cidsToKeep);
        }
        return validDeals;
    }
    async getDealById(dealId) {
        const cids = await this.getDealCids();
        const dealCid = cids[dealId - 1];
        if (dealCid) {
            return await this.get(dealCid["/"]);
        }
        else {
            return null;
        }
    }
    async getDealExpiration(proposalId) {
        try {
            const result = await __classPrivateFieldGet(this, _dealExpirations).get(Buffer.from(proposalId.root.value));
            return parseInt(result.toString(), 10);
        }
        catch (e) {
            if (e.status === NOTFOUND) {
                return null;
            }
            throw e;
        }
    }
    async putDealCids(cids) {
        await this.base.put(DealInfoManager.Deals, JSON.stringify(cids));
    }
}
exports.default = DealInfoManager;
_dealExpirations = new WeakMap();
DealInfoManager.Deals = Buffer.from("deals");
//# sourceMappingURL=deal-info-manager.js.map