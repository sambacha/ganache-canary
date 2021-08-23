"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tag = void 0;
var Tag;
(function (Tag) {
    Tag["EARLIEST"] = "earliest";
    Tag["LATEST"] = "latest";
    Tag["PENDING"] = "pending";
})(Tag = exports.Tag || (exports.Tag = {}));
var _Tag;
(function (_Tag) {
    _Tag[_Tag["earliest"] = 0] = "earliest";
    _Tag[_Tag["latest"] = 1] = "latest";
    _Tag[_Tag["pending"] = 2] = "pending";
})(_Tag || (_Tag = {}));
(function (Tag) {
    function normalize(tag) {
        if (typeof tag === "string") {
            return Tag[tag.toUpperCase()];
        }
        else {
            switch (tag) {
                case _Tag.earliest:
                    return Tag.EARLIEST;
                case _Tag.latest:
                    return Tag.LATEST;
                case _Tag.pending:
                    return Tag.PENDING;
            }
        }
    }
    Tag.normalize = normalize;
})(Tag = exports.Tag || (exports.Tag = {}));
//# sourceMappingURL=tags.js.map