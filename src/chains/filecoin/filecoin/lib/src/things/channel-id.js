"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelID = void 0;
const serializable_object_1 = require("./serializable-object");
class ChannelID extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.initiator = super.initializeValue(this.config.initiator, options);
        this.responder = super.initializeValue(this.config.responder, options);
        this.id = super.initializeValue(this.config.id, options);
    }
    get config() {
        return {
            initiator: {
                deserializedName: "initiator",
                serializedName: "Initiator",
                defaultValue: ""
            },
            responder: {
                deserializedName: "responder",
                serializedName: "Responder",
                defaultValue: ""
            },
            id: {
                deserializedName: "id",
                serializedName: "ID",
                defaultValue: 0
            }
        };
    }
}
exports.ChannelID = ChannelID;
//# sourceMappingURL=channel-id.js.map