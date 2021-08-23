"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockMessages = void 0;
const message_1 = require("./message");
const root_cid_1 = require("./root-cid");
const serializable_object_1 = require("./serializable-object");
const sig_type_1 = require("./sig-type");
const signed_message_1 = require("./signed-message");
class BlockMessages extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.blsMessages = super.initializeValue(this.config.blsMessages, options);
        this.secpkMessages = super.initializeValue(this.config.secpkMessages, options);
        this.cids = super.initializeValue(this.config.cids, options);
        this.initializeCids();
    }
    get config() {
        return {
            blsMessages: {
                deserializedName: "blsMessages",
                serializedName: "BlsMessages",
                defaultValue: options => options ? options.map(message => new message_1.Message(message)) : []
            },
            secpkMessages: {
                deserializedName: "secpkMessages",
                serializedName: "SecpkMessages",
                defaultValue: options => options ? options.map(message => new signed_message_1.SignedMessage(message)) : []
            },
            cids: {
                deserializedName: "cids",
                serializedName: "Cids",
                defaultValue: options => options ? options.map(rootCid => new root_cid_1.RootCID(rootCid)) : []
            }
        };
    }
    // Reference implementation: https://git.io/JtW8K
    initializeCids() {
        if (this.cids.length !==
            this.blsMessages.length + this.secpkMessages.length) {
            for (const blsMessage of this.blsMessages) {
                this.cids.push(new root_cid_1.RootCID({
                    root: blsMessage.cid
                }));
            }
            for (const secpkMessage of this.secpkMessages) {
                this.cids.push(new root_cid_1.RootCID({
                    root: secpkMessage.cid
                }));
            }
        }
    }
    static fromSignedMessages(signedMessages) {
        const blockMessages = new BlockMessages();
        for (const signedMessage of signedMessages) {
            if (signedMessage.signature.type === sig_type_1.SigType.SigTypeBLS) {
                blockMessages.blsMessages.push(signedMessage.message);
            }
            else {
                blockMessages.secpkMessages.push(signedMessage);
            }
        }
        blockMessages.initializeCids();
        return blockMessages;
    }
}
exports.BlockMessages = BlockMessages;
//# sourceMappingURL=block-messages.js.map