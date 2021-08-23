"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasOwn = void 0;
/**
 * /**
 * Determines whether an object has a property with the specified name.
 *
 * Safe for use on user-supplied data.
 *
 * @param obj The object that will be checked.
 * @param v A property name.
 * @returns `true` if the object has a property with the specified name,
 * otherwise false.
 */
exports.hasOwn = {}.hasOwnProperty.call.bind({}.hasOwnProperty);
//# sourceMappingURL=has-own.js.map