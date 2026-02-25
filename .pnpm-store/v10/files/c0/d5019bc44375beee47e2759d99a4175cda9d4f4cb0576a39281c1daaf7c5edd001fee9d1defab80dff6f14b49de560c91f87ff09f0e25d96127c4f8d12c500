"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebpackE2EWebServerInfo = getWebpackE2EWebServerInfo;
const devkit_1 = require("@nx/devkit");
const e2e_web_server_info_utils_1 = require("@nx/devkit/src/generators/e2e-web-server-info-utils");
async function getWebpackE2EWebServerInfo(tree, projectName, configFilePath, isPluginBeingAdded, e2ePortOverride) {
    const nxJson = (0, devkit_1.readNxJson)(tree);
    let e2ePort = e2ePortOverride ?? 4200;
    if (nxJson.targetDefaults?.['serve'] &&
        nxJson.targetDefaults?.['serve'].options?.port) {
        e2ePort = nxJson.targetDefaults?.['serve'].options?.port;
    }
    return (0, e2e_web_server_info_utils_1.getE2EWebServerInfo)(tree, projectName, {
        plugin: '@nx/webpack/plugin',
        serveTargetName: 'serveTargetName',
        serveStaticTargetName: 'serveStaticTargetName',
        configFilePath,
    }, {
        defaultServeTargetName: 'serve',
        defaultServeStaticTargetName: 'serve-static',
        defaultE2EWebServerAddress: `http://localhost:${e2ePort}`,
        defaultE2ECiBaseUrl: `http://localhost:${e2ePort}`,
        defaultE2EPort: e2ePort,
    }, isPluginBeingAdded);
}
