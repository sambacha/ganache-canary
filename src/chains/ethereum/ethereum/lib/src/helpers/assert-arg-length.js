"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertArgLength = void 0;
function assertArgLength(min, max = min) {
    return function (target, propertyKey, descriptor) {
        const original = descriptor.value;
        descriptor.value = function () {
            const length = arguments.length;
            if (length < min || length > max) {
                throw new Error(`Incorrect number of arguments. '${propertyKey}' requires ${min === max
                    ? `exactly ${min} ${min === 1 ? "argument" : "arguments"}.`
                    : `between ${min} and ${max} arguments.`}`);
            }
            return Reflect.apply(original, this, arguments);
        };
        return descriptor;
    };
}
exports.assertArgLength = assertArgLength;
//# sourceMappingURL=assert-arg-length.js.map