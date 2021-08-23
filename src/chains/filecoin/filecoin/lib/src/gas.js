"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMinerFee = exports.getBaseFee = exports.fillGasInformation = exports.getGasForMessage = exports.getGasForOnMethodInvocation = exports.getGasForOnChainMessage = exports.GasPricesCalico = void 0;
/**
 * A subset of gas prices after the Filecoin Calico version upgrade.
 * Reference implementation: https://git.io/JtEg6
 */
exports.GasPricesCalico = {
    computeGasMulti: 1,
    storageGasMulti: 1300,
    onChainMessageComputeBase: 38863,
    onChainMessageStorageBase: 36,
    onChainMessageStoragePerByte: 1,
    onChainReturnValuePerByte: 1,
    sendBase: 29233,
    sendTransferFunds: 27500,
    sendTransferOnlyPremium: 159672,
    sendInvokeMethod: -5377
};
// Reference implementation: https://git.io/JtEgH
function getGasForOnChainMessage(message) {
    const computeGas = exports.GasPricesCalico.onChainMessageComputeBase;
    const messageSize = JSON.stringify(message.serialize()).length;
    const storageForBytes = exports.GasPricesCalico.onChainMessageStoragePerByte *
        messageSize *
        exports.GasPricesCalico.storageGasMulti;
    const storageGas = exports.GasPricesCalico.onChainMessageStorageBase + storageForBytes;
    return computeGas + storageGas;
}
exports.getGasForOnChainMessage = getGasForOnChainMessage;
function getGasForOnMethodInvocation(message) {
    let gasUsed = exports.GasPricesCalico.sendBase;
    if (message.value !== 0n) {
        gasUsed += exports.GasPricesCalico.sendTransferFunds;
        if (message.method === 0) {
            gasUsed += exports.GasPricesCalico.sendTransferOnlyPremium;
        }
    }
    if (message.method !== 0) {
        gasUsed += exports.GasPricesCalico.sendInvokeMethod;
    }
    return gasUsed;
}
exports.getGasForOnMethodInvocation = getGasForOnMethodInvocation;
// Reference implementation: https://git.io/JtE2v adds the onchainmessage gas and return gas.
// https://git.io/JtE2Z gets called from above and adds invocation gas, which is simply just
// calling https://git.io/JtE2l.
// We don't add any return gas because transfers (method = 0) always return null in the ret
// value from vm.send() (which means there's no additional costs); see reference implementation
// here: https://git.io/JtE29.
function getGasForMessage(message) {
    return (getGasForOnChainMessage(message) + getGasForOnMethodInvocation(message));
}
exports.getGasForMessage = getGasForMessage;
// Reference implementation: https://git.io/JtWnk
function fillGasInformation(message, spec) {
    if (message.gasLimit === 0) {
        // Reference implementation: https://git.io/JtWZB
        // We don't bother with adding the buffer since this is "exactimation"
        message.gasLimit = getGasForMessage(message);
    }
    if (message.gasPremium === 0n) {
        // Reference implementation: https://git.io/JtWnm
        // Since this seems to look at prior prices and try to determine
        // them from there, and it implies a network coming up with those
        // prices, I'm just going to use 1 * MinGasPremium (https://git.io/JtWnG)
        message.gasPremium = 100000n;
    }
    if (message.gasFeeCap === 0n) {
        // Reference implementation: https://git.io/JtWn4
        // The effective computation is `GasFeeCap = GasPremium + BaseFee`
        // where the BaseFee is computed as a growing number based on the
        // block's ParentBaseFee, which we currently never set to non-zero in Ganache,
        // so the algorithm is simplified to `GasFeeCap = GasPremium`.
        // While there was no initial reason to set ParentBaseFee to a non-zero
        // value, after reading the description here https://git.io/JtEaP,
        // I believe that this is a fair assumption for Ganache. Ganache isn't meant
        // (yet) to simulate a live network with network conditions and computations.
        message.gasFeeCap = message.gasPremium;
    }
    // Reference Implementation: https://git.io/JtWng
    if (spec.maxFee === 0n) {
        // since the default is to guess network on conditions if 0, we're just going to skip
        return;
    }
    else {
        const totalFee = BigInt(message.gasLimit) * message.gasFeeCap;
        if (totalFee <= spec.maxFee) {
            return;
        }
        message.gasFeeCap = spec.maxFee / BigInt(message.gasLimit);
        message.gasPremium =
            message.gasFeeCap < message.gasPremium
                ? message.gasFeeCap
                : message.gasPremium;
    }
}
exports.fillGasInformation = fillGasInformation;
/**
 * Ganache currently doesn't implement BaseFee as it is
 * computed based on network conditions and block congestion,
 * neither of which Ganache is meant to do (yet).
 *
 * @returns 0
 */
function getBaseFee() {
    return 0;
}
exports.getBaseFee = getBaseFee;
/**
 * Helper function to get the miner fee for a message
 */
function getMinerFee(message) {
    // Reference: https://spec.filecoin.io/systems/filecoin_vm/gas_fee/
    // They state to use the GasLimit instead of GasUsed "in order to make
    // message selection for miners more straightforward". 🤷
    return BigInt(message.gasLimit) * message.gasPremium;
}
exports.getMinerFee = getMinerFee;
//# sourceMappingURL=gas.js.map