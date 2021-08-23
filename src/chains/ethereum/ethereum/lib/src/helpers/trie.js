"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GanacheTrie = void 0;
const merkle_patricia_tree_1 = require("merkle-patricia-tree");
class GanacheTrie extends merkle_patricia_tree_1.SecureTrie {
    constructor(db, root, blockchain) {
        super(db, root);
        this.blockchain = blockchain;
    }
    setContext(stateRoot, address, blockNumber) {
        this.root = stateRoot;
    }
    /**
     * Returns a copy of the underlying trie with the interface of GanacheTrie.
     * @param includeCheckpoints - If true and during a checkpoint, the copy will contain the checkpointing metadata and will use the same scratch as underlying db.
     */
    copy(includeCheckpoints = true) {
        const db = this.db.copy();
        const secureTrie = new GanacheTrie(db._leveldb, this.root, this.blockchain);
        if (includeCheckpoints && this.isCheckpoint) {
            secureTrie.db.checkpoints = [...this.db.checkpoints];
        }
        return secureTrie;
    }
}
exports.GanacheTrie = GanacheTrie;
//# sourceMappingURL=trie.js.map