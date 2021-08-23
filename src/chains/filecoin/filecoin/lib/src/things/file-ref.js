"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileRef = void 0;
const serializable_object_1 = require("./serializable-object");
class FileRef extends serializable_object_1.SerializableObject {
    constructor(options) {
        super();
        this.path = super.initializeValue(this.config.path, options);
        this.isCAR = super.initializeValue(this.config.isCAR, options);
    }
    get config() {
        return {
            path: {
                deserializedName: "path",
                serializedName: "Path",
                defaultValue: ""
            },
            isCAR: {
                deserializedName: "isCAR",
                serializedName: "IsCAR",
                defaultValue: false
            }
        };
    }
}
exports.FileRef = FileRef;
//# sourceMappingURL=file-ref.js.map