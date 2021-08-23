"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _privateKey;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressNetwork = exports.AddressProtocol = exports.Address = void 0;
const serializable_literal_1 = require("./serializable-literal");
const blakejs_1 = __importDefault(require("blakejs"));
const bls = __importStar(require("noble-bls12-381"));
const secp256k1_1 = __importDefault(require("secp256k1"));
const base32_encoding_1 = __importDefault(require("base32-encoding"));
const borc_1 = __importDefault(require("borc"));
const utils_1 = require("@ganache/utils");
var AddressProtocol;
(function (AddressProtocol) {
    AddressProtocol[AddressProtocol["ID"] = 0] = "ID";
    AddressProtocol[AddressProtocol["SECP256K1"] = 1] = "SECP256K1";
    AddressProtocol[AddressProtocol["Actor"] = 2] = "Actor";
    AddressProtocol[AddressProtocol["BLS"] = 3] = "BLS";
    AddressProtocol[AddressProtocol["Unknown"] = 255] = "Unknown";
})(AddressProtocol || (AddressProtocol = {}));
exports.AddressProtocol = AddressProtocol;
var AddressNetwork;
(function (AddressNetwork) {
    AddressNetwork["Testnet"] = "t";
    AddressNetwork["Mainnet"] = "f";
    AddressNetwork["Unknown"] = "UNKNOWN";
})(AddressNetwork || (AddressNetwork = {}));
exports.AddressNetwork = AddressNetwork;
function switchEndianness(hexString) {
    const regex = hexString.match(/.{2}/g);
    if (!regex) {
        throw new Error(`Could not switch endianness of hex string: ${hexString}`);
    }
    return regex.reverse().join("");
}
class Address extends serializable_literal_1.SerializableLiteral {
    constructor(publicAddress, privateKey) {
        super(publicAddress);
        _privateKey.set(this, void 0);
        __classPrivateFieldSet(this, _privateKey, privateKey);
    }
    get config() {
        return {};
    }
    get privateKey() {
        return __classPrivateFieldGet(this, _privateKey);
    }
    get network() {
        return Address.parseNetwork(this.value);
    }
    get protocol() {
        return Address.parseProtocol(this.value);
    }
    setPrivateKey(privateKey) {
        __classPrivateFieldSet(this, _privateKey, privateKey);
    }
    async signProposal(proposal) {
        if (__classPrivateFieldGet(this, _privateKey)) {
            const serialized = proposal.serialize();
            const encoded = borc_1.default.encode(serialized);
            const signature = await bls.sign(encoded, __classPrivateFieldGet(this, _privateKey));
            return Buffer.from(signature);
        }
        else {
            throw new Error(`Could not sign proposal with address ${this.value} due to not having the associated private key.`);
        }
    }
    async signMessage(message) {
        if (__classPrivateFieldGet(this, _privateKey)) {
            // TODO (Issue ganache#867): From the code at https://git.io/Jtud2,
            // it appears that messages are signed using the CID. However there are
            // two issues here that I spent too much time trying to figure out:
            //   1. We don't generate an identical CID
            //   2. Even if we did, this signature doesn't match what lotus provides
            // But here's the catch, I know for certain `signBuffer` mimics lotus's
            // Filecoin.WalletSign method. In other words, if I take the CID that lotus gives me
            // and put it back into Filecoin.WalletSign, it matches the below output
            // (given that message.cid.value was replaced by the CID string provided
            // by lotus for the same message). I'm not sure what's wrong here without
            // debugging lotus itself and watching the values change, but since we're
            // not guaranteeing cryptographic integrity, I'm letting this one slide for now.
            return await this.signBuffer(Buffer.from(message.cid.value));
        }
        else {
            throw new Error(`Could not sign message with address ${this.value} due to not having the associated private key.`);
        }
    }
    async signBuffer(buffer) {
        if (__classPrivateFieldGet(this, _privateKey)) {
            switch (this.protocol) {
                case AddressProtocol.BLS: {
                    const signature = await bls.sign(buffer, switchEndianness(__classPrivateFieldGet(this, _privateKey)));
                    return Buffer.from(signature);
                }
                case AddressProtocol.SECP256K1: {
                    const hash = blakejs_1.default.blake2b(buffer, null, 32);
                    const result = secp256k1_1.default.ecdsaSign(hash, Buffer.from(__classPrivateFieldGet(this, _privateKey), "hex"));
                    return Buffer.concat([result.signature, Buffer.from([result.recid])]);
                }
                default: {
                    throw new Error(`Cannot sign with this protocol ${this.protocol}. Supported protocols: BLS and SECP256K1`);
                }
            }
        }
        else {
            throw new Error(`Could not sign message with address ${this.value} due to not having the associated private key.`);
        }
    }
    async verifySignature(buffer, signature) {
        switch (this.protocol) {
            case AddressProtocol.BLS: {
                return await bls.verify(signature.data, buffer, Address.recoverBLSPublicKey(this.value));
            }
            case AddressProtocol.SECP256K1: {
                const hash = blakejs_1.default.blake2b(buffer, null, 32);
                return secp256k1_1.default.ecdsaVerify(signature.data.slice(0, 64), // remove the recid suffix (should be the last/65th byte)
                hash, Address.recoverSECP256K1PublicKey(signature, hash));
            }
            default: {
                return false;
            }
        }
    }
    static recoverBLSPublicKey(address) {
        const protocol = Address.parseProtocol(address);
        const decoded = base32_encoding_1.default.parse(address.slice(2), Address.CustomBase32Alphabet);
        const payload = decoded.slice(0, decoded.length - 4);
        if (protocol === AddressProtocol.BLS) {
            return payload;
        }
        else {
            throw new Error("Address is not a BLS protocol; cannot recover the public key.");
        }
    }
    static recoverSECP256K1PublicKey(signature, message) {
        return Buffer.from(secp256k1_1.default.ecdsaRecover(signature.data.slice(0, 64), signature.data[64], message).buffer);
    }
    static fromPrivateKey(privateKey, protocol = AddressProtocol.BLS, network = AddressNetwork.Testnet) {
        let publicKey;
        let payload;
        if (protocol === AddressProtocol.BLS) {
            // Get the public key
            // BLS uses big endian, but we use little endian
            publicKey = Buffer.from(bls.getPublicKey(switchEndianness(privateKey)));
            payload = publicKey;
        }
        else if (protocol === AddressProtocol.SECP256K1) {
            publicKey = Buffer.from(secp256k1_1.default.publicKeyCreate(Buffer.from(privateKey, "hex"), false));
            // https://bit.ly/3atGMwX says blake2b-160, but calls the checksum
            // both blake2b-4 and 4 bytes, so there is inconsistency of the
            // terminology of bytes vs bits, but the implementation at
            // https://git.io/JtEM6 shows 20 bytes and 4 bytes respectively
            payload = Buffer.from(blakejs_1.default.blake2b(publicKey, null, 20));
        }
        else {
            throw new Error("Protocol type not yet supported. Supported address protocols: BLS, SECP256K1");
        }
        const checksum = Address.createChecksum(protocol, payload);
        // Merge the public key and checksum
        const payloadAndChecksum = Buffer.concat([payload, checksum]);
        // Use a custom alphabet to base32 encode the checksummed public key,
        // and prepend the network and protocol identifiers.
        const address = `${network}${protocol}${base32_encoding_1.default.stringify(payloadAndChecksum, Address.CustomBase32Alphabet)}`;
        return new Address(address, privateKey);
    }
    static random(rng = new utils_1.RandomNumberGenerator(), protocol = AddressProtocol.BLS, network = AddressNetwork.Testnet) {
        // Note that this private key isn't cryptographically secure!
        // It uses insecure randomization! Don't use it in production!
        const privateKey = rng.getBuffer(32).toString("hex");
        return Address.fromPrivateKey(privateKey, protocol, network);
    }
    static parseNetwork(publicAddress) {
        if (publicAddress.length < 1) {
            return AddressNetwork.Unknown;
        }
        switch (publicAddress.charAt(0)) {
            case AddressNetwork.Mainnet: {
                return AddressNetwork.Mainnet;
            }
            case AddressNetwork.Testnet: {
                return AddressNetwork.Testnet;
            }
            default: {
                return AddressNetwork.Unknown;
            }
        }
    }
    static parseProtocol(publicAddress) {
        if (publicAddress.length < 2) {
            return AddressProtocol.Unknown;
        }
        switch (parseInt(publicAddress.charAt(1), 10)) {
            case AddressProtocol.ID: {
                return AddressProtocol.ID;
            }
            case AddressProtocol.BLS: {
                return AddressProtocol.BLS;
            }
            case AddressProtocol.Actor: {
                return AddressProtocol.Actor;
            }
            case AddressProtocol.SECP256K1: {
                return AddressProtocol.SECP256K1;
            }
            default: {
                return AddressProtocol.Unknown;
            }
        }
    }
    /**
     * Creates an AddressProtocol.ID address
     * @param id A positive integer for the id.
     * @param isSingletonSystemActor If false, it adds Address.FirstNonSingletonActorId to the id.
     * Almost always `false`. See https://git.io/JtgqL for examples of singleton system actors.
     * @param network The AddressNetwork prefix for the address; usually AddressNetwork.Testnet for Ganache.
     */
    static fromId(id, isSingletonSystemActor = false, isMiner = false, network = AddressNetwork.Testnet) {
        if (Math.round(id) !== id || id < 0) {
            throw new Error("id must be a positive integer");
        }
        return new Address(`${network}${AddressProtocol.ID}${isSingletonSystemActor
            ? id
            : isMiner
                ? Address.FirstMinerId + id
                : Address.FirstNonSingletonActorId + id}`);
    }
    static createChecksum(protocol, payload) {
        // Create a checksum using the blake2b algorithm
        const checksumBuffer = Buffer.concat([Buffer.from([protocol]), payload]);
        const checksum = blakejs_1.default.blake2b(checksumBuffer, null, Address.CHECKSUM_BYTES);
        return Buffer.from(checksum.buffer);
    }
    static validate(inputAddress) {
        inputAddress = inputAddress.trim();
        if (inputAddress === "" || inputAddress === "<empty>") {
            throw new Error("invalid address length");
        }
        // MaxAddressStringLength is the max length of an address encoded as a string
        // it includes the network prefix, protocol, and bls publickey (bls is the longest)
        const MaxAddressStringLength = 2 + 84;
        if (inputAddress.length > MaxAddressStringLength ||
            inputAddress.length < 3) {
            throw new Error("invalid address length");
        }
        const address = new Address(inputAddress);
        const raw = address.value.slice(2);
        if (address.network === AddressNetwork.Unknown) {
            throw new Error("unknown address network");
        }
        if (address.protocol === AddressProtocol.Unknown) {
            throw new Error("unknown address protocol");
        }
        if (address.protocol === AddressProtocol.ID) {
            if (raw.length > 20) {
                throw new Error("invalid address length");
            }
            const id = parseInt(raw, 10);
            if (isNaN(id) || id.toString(10) !== raw) {
                throw new Error("invalid address payload");
            }
            return address;
        }
        const payloadWithChecksum = base32_encoding_1.default.parse(raw, Address.CustomBase32Alphabet);
        if (payloadWithChecksum.length < Address.CHECKSUM_BYTES) {
            throw new Error("invalid address checksum");
        }
        const payload = payloadWithChecksum.slice(0, payloadWithChecksum.length - Address.CHECKSUM_BYTES);
        const providedChecksum = payloadWithChecksum.slice(payloadWithChecksum.length - Address.CHECKSUM_BYTES);
        if (address.protocol === AddressProtocol.SECP256K1 ||
            address.protocol === AddressProtocol.Actor) {
            if (payload.length !== 20) {
                throw new Error("invalid address payload");
            }
        }
        const generatedChecksum = Address.createChecksum(address.protocol, payload);
        if (!generatedChecksum.equals(providedChecksum)) {
            throw new Error("invalid address checksum");
        }
        return address;
    }
}
exports.Address = Address;
_privateKey = new WeakMap();
Address.FirstNonSingletonActorId = 100; // Ref impl: https://git.io/JtgqT
Address.FirstMinerId = 1000; // Ref impl: https://git.io/Jt2WE
Address.CHECKSUM_BYTES = 4;
Address.CustomBase32Alphabet = "abcdefghijklmnopqrstuvwxyz234567";
//# sourceMappingURL=address.js.map