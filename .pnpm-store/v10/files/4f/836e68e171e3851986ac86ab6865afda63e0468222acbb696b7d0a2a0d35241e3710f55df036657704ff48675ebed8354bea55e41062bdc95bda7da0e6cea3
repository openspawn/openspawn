"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showPossibleWarnings = showPossibleWarnings;
const pc = require("picocolors");
const devkit_1 = require("@nx/devkit");
function showPossibleWarnings(tree, options) {
    if (options.style === 'styled-jsx' && options.compiler === 'swc') {
        devkit_1.logger.warn(`styled-jsx may not work with SWC. Try using ${pc.bold('nx g @nx/react:app --compiler=babel')} instead.`);
    }
}
