"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForkOptions = void 0;
const helpers_1 = require("./helpers");
const ethereum_utils_1 = require("@ganache/ethereum-utils");
const url_1 = require("url");
const { version } = { "version": "7.0.0-canary.1341" };
// we aren't going to treat block numbers as a bigint, so we don't want to
// accept block numbers we can't add to
const MAX_BLOCK_NUMBER = Math.floor(Number.MAX_SAFE_INTEGER / 2);
const reColonSplit = /:\s?(?:.+)/;
function coerceHeaders(headers, input) {
    // split *1* time on the first colon, this also ignores leading whitespace
    // from the value per RFC7230
    const [name, value] = input.split(reColonSplit);
    headers.push({ name, value });
    return headers;
}
const ALLOWED_PROTOCOLS = ["ws:", "wss:", "http:", "https:"];
const arrayToOxfordList = (arr, conjunction = "and") => {
    const last = arr.pop();
    switch (arr.length) {
        case 0:
            return "";
        case 1:
            return last;
        case 2:
            return arr[0] + ` ${conjunction} ` + last;
        default:
            return arr.join(", ") + `, ${conjunction} ` + last;
    }
};
exports.ForkOptions = {
    // url's definition _must_ come before blockNumber, username, and password
    // as the defaults are processed in order, and they rely on the `fork.url`
    url: {
        normalize: rawInput => {
            if (typeof rawInput !== "string")
                return;
            let url = new url_1.URL(rawInput);
            const path = url.pathname + url.search;
            const lastIndex = path.lastIndexOf("@");
            // pull the blockNumber out of the URL
            if (lastIndex !== -1) {
                // remove everything after the last @
                url = new url_1.URL(path.substr(0, lastIndex), url);
                const blockNumber = path.substr(lastIndex + 1);
                if (blockNumber && blockNumber !== ethereum_utils_1.Tag.LATEST) {
                    // don't use parseInt because strings like `"123abc"` parse
                    // to `123`, and there is probably an error on the user's side we'd
                    // want to uncover.
                    const asNum = blockNumber - 0;
                    // don't allow invalid, negative, or decimals
                    if (isNaN(asNum) ||
                        asNum < 0 ||
                        (asNum | 0) !== asNum ||
                        asNum > MAX_BLOCK_NUMBER) {
                        console.warn(`Ignoring invalid block number in fork url: "${blockNumber}". Block number must be an integer from [0 - ${MAX_BLOCK_NUMBER}].`);
                    }
                    else {
                        url._blockNumber = asNum;
                    }
                }
                if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
                    throw new Error(`Invalid protocol for fork url: ${url.protocol}. Supported protocols are: ${arrayToOxfordList(ALLOWED_PROTOCOLS)}.`);
                }
            }
            return url;
        },
        cliDescription: `Fork from another currently running Ethereum client at a given block. Input should be the URL of the node, e.g. \`"http://localhost:1337"\`. You can optionally specify the block to fork from using an @ sign: \`"http://localhost:1337@8675309"\`.

You can specify Basic Authentication credentials in the URL as well. e.g., \`"wss://user:password@example.com/"\`. If you need to use an Infura Project Secret, you would use it like this: \`"wss://:{YOUR-PROJECT-SECRET}@mainnet.infura.com/..."\`

Alternatively, you can use the \`fork.username\` and \`fork.password\` options.`,
        legacyName: "fork",
        cliAliases: ["f", "fork"]
    },
    provider: {
        normalize: rawInput => {
            // if rawInput is a string it will be handled by the `url` handler
            if (typeof rawInput === "string")
                return;
            return rawInput;
        },
        cliDescription: "Specify an EIP-1193 provider to use instead of a url.",
        disableInCLI: true,
        legacyName: "fork"
    },
    blockNumber: {
        normalize: helpers_1.normalize,
        cliDescription: "Block number the provider should fork from.",
        legacyName: "fork_block_number",
        default: ({ url, provider }) => {
            if (url) {
                // use the url's _blockNumber, if present, otherwise use "latest"
                if (url._blockNumber) {
                    return url._blockNumber;
                }
                else {
                    return ethereum_utils_1.Tag.LATEST;
                }
            }
            else if (provider) {
                return ethereum_utils_1.Tag.LATEST;
            }
            else {
                return;
            }
        },
        defaultDescription: `"${ethereum_utils_1.Tag.LATEST}"`
        //implies: ["url"]
    },
    username: {
        normalize: helpers_1.normalize,
        cliDescription: `* Username to use for Basic Authentication. Does not require setting \`fork.password\`.
    
When combined with \`fork.password\`, is shorthand for \`fork: { headers: { "Authorization": "Basic {ENCODED-BASIC-HEADER}" } }\`

If the \`fork.headers\` option specifies an "Authorization" header, it will be be inserted _after_ this Basic token.`,
        default: ({ url }) => {
            // use the url's username, if present
            if (url) {
                if (url.username) {
                    return url.username;
                }
            }
        },
        defaultDescription: ""
        //implies: ["url"]
    },
    password: {
        normalize: helpers_1.normalize,
        cliDescription: `Password to use for Basic Authentication. Does not require setting \`fork.username\`.

When combined with \`fork.username\`, is shorthand for \`fork: { headers: { "Authorization": "Basic {ENCODED-BASIC-HEADER}" } }\`

If the \`fork.headers\` option specifies an "Authorization" header, it will be be inserted _after_ this Basic token.`,
        default: ({ url }) => {
            // use the url's password, if present
            if (url) {
                if (url.password) {
                    return url.password;
                }
            }
        },
        defaultDescription: ""
        //implies: ["url"]
    },
    jwt: {
        normalize: helpers_1.normalize,
        cliDescription: `_Encoded_ JSON Web Token (JWT) used for authenticating to some servers.

Shorthand for \`fork: { headers: { "Authorization": "Bearer {YOUR-ENCODED-JWT}" } }\`

 If the \`fork.headers\` option specifies an "Authorization" header, it will be be inserted _after_ the JWT Bearer token.`
        //implies: ["url"]
    },
    userAgent: {
        normalize: helpers_1.normalize,
        cliDescription: `The User-Agent header sent to the fork on each request.

Sent as Api-User-Agent when used in the browser.
 
Will be overridden by a \`"User-Agent"\` defined in the \`fork.headers\` option, if provided.`,
        default: () => {
            return `Ganache/${version} (https://www.trufflesuite.com/ganache; ganache<at>trufflesuite.com)`;
        }
        // implies: ["url"]
    },
    origin: {
        normalize: helpers_1.normalize,
        cliDescription: `The Origin header sent to the fork on each request.

Ignored in the browser.

Will be overridden by an \`"Origin"\` value defined in the \`fork.headers\` option, if provided.`
        //implies: ["url"]
    },
    headers: {
        normalize: helpers_1.normalize,
        cliDescription: `Headers to supply on each request to the forked provider.

Headers set here override headers set by other options, unless otherwise specified.

Defaults to: \`["User-Agent: Ganache/VERSION (https://www.trufflesuite.com/ganache; ganache<at>trufflesuite.com)"]\``,
        cliType: "array:string",
        implies: ["url"],
        cliCoerce: rawInput => rawInput.reduce(coerceHeaders, [])
    },
    requestsPerSecond: {
        normalize(rawValue) {
            if (rawValue < 0) {
                throw new Error(`fork.requestsPerSecond is invalid: "${rawValue}"; must be a positive number`);
            }
            return rawValue;
        },
        default: () => 0,
        cliDescription: "Restrict the number of requests per second sent to the fork provider. `0` means no limit is applied.",
        cliType: "number"
        //implies: ["url"]
    }
};
//# sourceMappingURL=fork-options.js.map