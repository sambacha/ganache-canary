"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ipfs_1 = require("ipfs");
const ipfs_http_server_1 = __importDefault(require("ipfs-http-server"));
class IPFSServer {
    constructor(chainOptions) {
        this.options = chainOptions;
        this.node = null;
        this.httpServer = null;
    }
    async start(parentDirectory) {
        const folder = path_1.default.join(parentDirectory, "ganache-ipfs");
        if (!fs_1.default.existsSync(folder)) {
            await fs_1.default.promises.mkdir(folder);
        }
        this.node = await ipfs_1.create({
            repo: folder,
            config: {
                Addresses: {
                    Swarm: [],
                    // Note that this config doesn't actually trigger the API and gateway; see below.
                    API: `/ip4/${this.options.ipfsHost}/tcp/${this.options.ipfsPort}`,
                    Gateway: `/ip4/${this.options.ipfsHost}/tcp/9090`
                },
                Bootstrap: [],
                Discovery: {
                    MDNS: {
                        Enabled: false
                    },
                    webRTCStar: {
                        Enabled: false
                    }
                },
                // API isn't in the types, but it's used by ipfs-http-server
                // @ts-ignore
                API: {
                    HTTPHeaders: {
                        "Access-Control-Allow-Origin": ["*"],
                        "Access-Control-Allow-Credentials": "true"
                    }
                }
            },
            start: true,
            silent: true
        });
        // remove all initial pins that IPFS pins automatically
        for await (const pin of this.node.pin.ls({ type: "recursive" })) {
            await this.node.pin.rm(pin.cid);
        }
        this.httpServer = new ipfs_http_server_1.default(this.node);
        await this.httpServer.start();
    }
    async stop() {
        if (this.httpServer) {
            await this.httpServer.stop();
        }
        if (this.node) {
            await this.node.stop();
        }
    }
}
exports.default = IPFSServer;
//# sourceMappingURL=ipfs-server.js.map