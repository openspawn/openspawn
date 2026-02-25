"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const normalize_webpack_path_1 = require("@module-federation/sdk/normalize-webpack-path");
const utils_1 = require("./utils");
const { Template } = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack'));
function getFederationGlobal(template, runtimeGlobals, matcher, rootOutputDir, initOptionsWithoutShared) {
    const federationGlobal = (0, utils_1.getFederationGlobalScope)(runtimeGlobals);
    const initOptionsStrWithoutShared = JSON.stringify({
        ...initOptionsWithoutShared,
        remotes: initOptionsWithoutShared.remotes.filter((remote) => remote.externalType === 'script'),
    });
    const remoteInfos = JSON.stringify(initOptionsWithoutShared.remotes.reduce((acc, remote) => {
        const item = {
            alias: remote.alias || '',
            name: remote.name,
            // @ts-ignore
            entry: remote.entry || '',
            // @ts-ignore
            shareScope: remote.shareScope,
            externalType: remote.externalType,
        };
        const key = remote.name || remote.alias || '';
        acc[key] ||= [];
        acc[key].push(item);
        return acc;
    }, {}));
    return template.asString([
        `if(!${federationGlobal}){`,
        template.indent([
            `${federationGlobal} = {`,
            template.indent([
                `initOptions: ${initOptionsStrWithoutShared},`,
                `chunkMatcher: function(chunkId) {return ${matcher}},`,
                `rootOutputDir: ${JSON.stringify(rootOutputDir || '')},`,
                `bundlerRuntimeOptions: { remotes: { remoteInfos: ${remoteInfos}, webpackRequire: ${runtimeGlobals.require},idToRemoteMap: {}, chunkMapping: {},idToExternalAndNameMapping: {} } }`,
            ]),
            '};',
        ]),
        `${runtimeGlobals.require}.consumesLoadingData = {}`,
        `${runtimeGlobals.require}.remotesLoadingData = {}`,
        '}',
    ]);
}
exports.default = getFederationGlobal;
//# sourceMappingURL=getFederationGlobal.js.map