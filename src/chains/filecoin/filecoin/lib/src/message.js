"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkMessage = exports.verifyMessageSignature = exports.ValidForBlockInclusion = void 0;
const address_1 = require("./things/address");
const balance_1 = require("./things/balance");
const sig_type_1 = require("./things/sig-type");
const borc_1 = __importDefault(require("borc"));
const ZeroAddress = "t3yaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaby2smx7a";
const TotalFilecoin = balance_1.Balance.FILToLowestDenomination(2000000000);
const BlockGasLimit = 10000000000;
const minimumBaseFee = 100;
// Reference implementation: https://git.io/JtErT
function ValidForBlockInclusion(m, minGas, version) {
    if (m.version !== 0) {
        return new Error("'Version' unsupported");
    }
    if (m.to.trim() === "") {
        return new Error("'To' address cannot be empty");
    }
    if (m.to === ZeroAddress && version >= 7) {
        return new Error("invalid 'To' address");
    }
    if (m.from.trim() === "") {
        return new Error("'From' address cannot be empty");
    }
    // We would have already thrown when trying to deserialize null for Value
    // if (m.Value.Int == nil) {
    //   return xerrors.New("'Value' cannot be nil")
    // }
    if (m.value < 0n) {
        return new Error("'Value' field cannot be negative");
    }
    if (m.value > TotalFilecoin) {
        return new Error("'Value' field cannot be greater than total filecoin supply");
    }
    // We would have already thrown when trying to deserialize null for GasFeeCap
    // if m.GasFeeCap.Int == nil {
    //   return xerrors.New("'GasFeeCap' cannot be nil")
    // }
    if (m.gasFeeCap < 0n) {
        return new Error("'GasFeeCap' field cannot be negative");
    }
    // We would have already thrown when trying to deserialize null for GasPremium
    // if m.GasPremium.Int == nil {
    //   return xerrors.New("'GasPremium' cannot be nil")
    // }
    if (m.gasPremium < 0n) {
        return new Error("'GasPremium' field cannot be negative");
    }
    if (m.gasPremium > m.gasFeeCap) {
        return new Error("'GasFeeCap' less than 'GasPremium'");
    }
    if (m.gasLimit > BlockGasLimit) {
        return new Error("'GasLimit' field cannot be greater than a block's gas limit");
    }
    // since prices might vary with time, this is technically semantic validation
    if (m.gasLimit < minGas) {
        return new Error(`'GasLimit' field cannot be less than the cost of storing a message on chain ${m.gasLimit} < ${minGas}`);
    }
    return null;
}
exports.ValidForBlockInclusion = ValidForBlockInclusion;
function sigCacheKey(signedMessage) {
    switch (signedMessage.signature.type) {
        case sig_type_1.SigType.SigTypeBLS:
            if (signedMessage.signature.data.length < 90) {
                return new Error("bls signature too short");
            }
            return (signedMessage.message.cid.value +
                signedMessage.signature.data.subarray(64).toString());
        case sig_type_1.SigType.SigTypeSecp256k1:
            return signedMessage.message.cid.value;
        default:
            return new Error(`unrecognized signature type: ${signedMessage.signature.type}`);
    }
}
async function verifyMessageSignature(signedMessage) {
    const sck = sigCacheKey(signedMessage);
    if (sck instanceof Error) {
        return sck;
    }
    // we would have already errored trying to serialized null
    // if sig == nil {
    //   return xerrors.Errorf("signature is nil")
    // }
    if (address_1.Address.parseProtocol(signedMessage.message.from) === address_1.AddressProtocol.ID) {
        return new Error("must resolve ID addresses before using them to verify a signature");
    }
    const address = new address_1.Address(signedMessage.message.from);
    switch (signedMessage.signature.type) {
        case sig_type_1.SigType.SigTypeBLS: {
            const verified = await address.verifySignature(Buffer.from(signedMessage.message.cid.value), signedMessage.signature);
            return verified ? null : new Error("bls signature failed to verify");
        }
        case sig_type_1.SigType.SigTypeSecp256k1: {
            const serialized = signedMessage.message.serialize();
            const encoded = borc_1.default.encode(serialized);
            const verified = address.verifySignature(encoded, signedMessage.signature);
            return verified ? null : new Error("signature did not match");
        }
        default:
            return new Error(`cannot verify signature of unsupported type: ${signedMessage.signature.type}`);
    }
}
exports.verifyMessageSignature = verifyMessageSignature;
// Reference implementation: https://git.io/JtErT
async function checkMessage(signedMessage) {
    const size = JSON.stringify(signedMessage.serialize()).length;
    if (size > 32 * 1024) {
        return new Error(`mpool message too large (${size}B): message too big`);
    }
    const validForBlockInclusion = ValidForBlockInclusion(signedMessage.message, 0, 8);
    if (validForBlockInclusion !== null) {
        return new Error(`message not valid for block inclusion: ${validForBlockInclusion.message}`);
    }
    if (signedMessage.message.gasFeeCap < minimumBaseFee) {
        return new Error("gas fee cap too low");
    }
    const verifySignature = await verifyMessageSignature(signedMessage);
    if (verifySignature !== null) {
        return verifySignature;
    }
    return null;
}
exports.checkMessage = checkMessage;
//# sourceMappingURL=message.js.map