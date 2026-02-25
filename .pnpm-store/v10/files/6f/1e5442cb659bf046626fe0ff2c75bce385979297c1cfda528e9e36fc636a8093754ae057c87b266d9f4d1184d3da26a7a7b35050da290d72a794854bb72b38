"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOutputHashFormat = getOutputHashFormat;
function getOutputHashFormat(option, length = 20) {
    const hashFormats = {
        none: { chunk: '', extract: '', file: '', script: '' },
        media: { chunk: '', extract: '', file: `.[hash:${length}]`, script: '' },
        bundles: {
            chunk: `.[chunkhash:${length}]`,
            extract: `.[contenthash:${length}]`,
            file: '',
            script: `.[contenthash:${length}]`,
        },
        all: {
            chunk: `.[chunkhash:${length}]`,
            extract: `.[contenthash:${length}]`,
            file: `.[contenthash:${length}]`,
            script: `.[contenthash:${length}]`,
        },
    };
    return hashFormats[option] || hashFormats['none'];
}
