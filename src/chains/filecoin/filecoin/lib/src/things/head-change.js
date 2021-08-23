"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeadChange = exports.HeadChangeType = void 0;
const serializable_object_1 = require("./serializable-object");
const tipset_1 = require("./tipset");
class HeadChange extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.type = super.initializeValue(this.config.type, options);
        this.val = super.initializeValue(this.config.val, options);
    }
    get config() {
        return {
            type: {
                deserializedName: "type",
                serializedName: "Type",
                defaultValue: options => options || HeadChangeType.HCCurrent
            },
            val: {
                deserializedName: "val",
                serializedName: "Val",
                defaultValue: options => new tipset_1.Tipset(options)
            }
        };
    }
}
exports.HeadChange = HeadChange;
// Retrieved these from https://git.io/Jtvke
var HeadChangeType;
(function (HeadChangeType) {
    HeadChangeType["HCRevert"] = "revert";
    HeadChangeType["HCApply"] = "apply";
    HeadChangeType["HCCurrent"] = "current";
})(HeadChangeType = exports.HeadChangeType || (exports.HeadChangeType = {}));
//# sourceMappingURL=head-change.js.map