"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SigType = void 0;
// Reference implementation: https://git.io/JtsJc
var SigType;
(function (SigType) {
    SigType[SigType["SigTypeUnknown"] = 255] = "SigTypeUnknown";
    SigType[SigType["SigTypeSecp256k1"] = 1] = "SigTypeSecp256k1";
    SigType[SigType["SigTypeBLS"] = 2] = "SigTypeBLS"; // Purposely not explicitly stating to coincide with reference implementation (which is autoincrement)
})(SigType = exports.SigType || (exports.SigType = {}));
//# sourceMappingURL=sig-type.js.map