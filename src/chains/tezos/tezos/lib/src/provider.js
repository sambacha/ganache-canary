"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const emittery_1 = __importDefault(require("emittery"));
class TezosProvider extends emittery_1.default.Typed {
    constructor(providerOptions) {
        super();
        this.emit("ready");
    }
    getOptions() {
        throw new Error("Method not supported (getOptions)");
    }
    getInitialAccounts() {
        throw new Error("Method not supported (getOptions)");
    }
    async close() {
        this.emit("close");
    }
}
exports.default = TezosProvider;
//# sourceMappingURL=provider.js.map