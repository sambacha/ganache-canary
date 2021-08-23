"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const manager_1 = __importDefault(require("./manager"));
const signed_message_1 = require("../things/signed-message");
class SignedMessageManager extends manager_1.default {
    static async initialize(base) {
        const manager = new SignedMessageManager(base);
        return manager;
    }
    constructor(base) {
        super(base, signed_message_1.SignedMessage);
    }
    async putSignedMessage(message) {
        await super.set(message.cid.value, message);
    }
}
exports.default = SignedMessageManager;
//# sourceMappingURL=message-manager.js.map