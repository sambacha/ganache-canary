"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartDealParams = void 0;
const storage_market_data_ref_1 = require("./storage-market-data-ref");
const address_1 = require("./address");
const serializable_object_1 = require("./serializable-object");
class StartDealParams extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.data = super.initializeValue(this.config.data, options);
        this.wallet = super.initializeValue(this.config.wallet, options);
        this.miner = super.initializeValue(this.config.miner, options);
        this.epochPrice = super.initializeValue(this.config.epochPrice, options);
        this.minBlocksDuration = super.initializeValue(this.config.minBlocksDuration, options);
        this.providerCollateral = super.initializeValue(this.config.providerCollateral, options);
        this.dealStartEpoch = super.initializeValue(this.config.dealStartEpoch, options);
        this.fastRetrieval = super.initializeValue(this.config.fastRetrieval, options);
        this.verifiedDeal = super.initializeValue(this.config.verifiedDeal, options);
    }
    get config() {
        return {
            data: {
                deserializedName: "data",
                serializedName: "Data",
                defaultValue: options => new storage_market_data_ref_1.StorageMarketDataRef(options)
            },
            wallet: {
                deserializedName: "wallet",
                serializedName: "Wallet",
                defaultValue: options => (options ? new address_1.Address(options) : null)
            },
            miner: {
                deserializedName: "miner",
                serializedName: "Miner",
                defaultValue: literal => literal ? new address_1.Address(literal) : address_1.Address.fromId(0, false, true)
            },
            epochPrice: {
                deserializedName: "epochPrice",
                serializedName: "EpochPrice",
                defaultValue: literal => (literal ? BigInt(literal) : 2500n)
            },
            minBlocksDuration: {
                deserializedName: "minBlocksDuration",
                serializedName: "MinBlocksDuration",
                defaultValue: 300
            },
            providerCollateral: {
                deserializedName: "providerCollateral",
                serializedName: "ProviderCollateral",
                defaultValue: literal => (literal ? BigInt(literal) : 0n)
            },
            dealStartEpoch: {
                deserializedName: "dealStartEpoch",
                serializedName: "dealStartEpoch",
                defaultValue: 0
            },
            fastRetrieval: {
                deserializedName: "fastRetrieval",
                serializedName: "FastRetrieval",
                defaultValue: false
            },
            verifiedDeal: {
                deserializedName: "verifiedDeal",
                serializedName: "VerifiedDeal",
                defaultValue: false
            }
        };
    }
}
exports.StartDealParams = StartDealParams;
//# sourceMappingURL=start-deal-params.js.map