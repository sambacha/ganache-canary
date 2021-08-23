"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RootCID = void 0;
const cid_1 = require("./cid");
const serializable_object_1 = require("./serializable-object");
class RootCID extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.root = super.initializeValue(this.config.root, options);
    }
    get config() {
        return {
            root: {
                deserializedName: "root",
                serializedName: "/",
                defaultValue: options => {
                    return options ? new cid_1.CID(options) : cid_1.CID.nullCID();
                }
            }
        };
    }
    asPath() {
        return "/" + this.root.value;
    }
}
exports.RootCID = RootCID;
//# sourceMappingURL=root-cid.js.map