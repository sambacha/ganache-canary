"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = __importDefault(require("./api"));
const lotus_client_schema_1 = __importDefault(require("@filecoin-shipyard/lotus-client-schema"));
const GanacheSchema = {
    methods: {}
};
const combinedMethods = {
    ...lotus_client_schema_1.default.mainnet.fullNode.methods,
    ...lotus_client_schema_1.default.mainnet.storageMiner.methods,
    ...lotus_client_schema_1.default.mainnet.gatewayApi.methods,
    ...lotus_client_schema_1.default.mainnet.walletApi.methods,
    ...lotus_client_schema_1.default.mainnet.workerApi.methods
};
// Use the FilecoinAPI to create a schema object representing the functions supported.
for (const methodName of Object.getOwnPropertyNames(api_1.default.prototype)) {
    if (methodName.startsWith("Filecoin.")) {
        const schemaName = methodName.replace("Filecoin.", "");
        GanacheSchema.methods[schemaName] = {
            subscription: combinedMethods[schemaName].subscription === true
        };
    }
    else {
        const namespaceMatch = /^(.+)\./.exec(methodName);
        if (namespaceMatch) {
            const namespace = namespaceMatch[1];
            const schemaName = methodName.replace(".", "");
            GanacheSchema.methods[schemaName] = {
                subscription: /Notify$/i.exec(methodName) !== null,
                namespace
            };
        }
    }
}
exports.default = GanacheSchema;
//# sourceMappingURL=schema.js.map