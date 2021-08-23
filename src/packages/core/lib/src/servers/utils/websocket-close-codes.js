"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var WebSocketCloseCodes;
(function (WebSocketCloseCodes) {
    /**
     * Normal closure; the connection successfully completed whatever purpose for
     * which it was created.
     */
    WebSocketCloseCodes[WebSocketCloseCodes["CLOSE_NORMAL"] = 1000] = "CLOSE_NORMAL";
    /**
     * Indicates that an endpoint is "going away", such as a server going down or
     * a browser having navigated away from a page.
     */
    // CLOSE_GOING_AWAY = 1001
    // CLOSE_PROTOCOL_ERROR = 1002,
    // CLOSE_ABNORMAL = 1006
})(WebSocketCloseCodes || (WebSocketCloseCodes = {}));
exports.default = WebSocketCloseCodes;
//# sourceMappingURL=websocket-close-codes.js.map