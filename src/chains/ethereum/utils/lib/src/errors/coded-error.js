"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodedError = void 0;
class CodedError extends Error {
    constructor(message, code) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.code = code;
    }
    static from(error, code) {
        const codedError = new CodedError(error.message, code);
        codedError.stack = error.stack;
        return codedError;
    }
}
exports.CodedError = CodedError;
//# sourceMappingURL=coded-error.js.map