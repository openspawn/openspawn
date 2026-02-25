"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ssrDevServerExecutor = ssrDevServerExecutor;
const devkit_1 = require("@nx/devkit");
const pc = require("picocolors");
const async_iterable_1 = require("@nx/devkit/src/utils/async-iterable");
const wait_until_server_is_listening_1 = require("./lib/wait-until-server-is-listening");
async function* ssrDevServerExecutor(options, context) {
    const browserTarget = (0, devkit_1.parseTargetString)(options.browserTarget, context.projectGraph);
    const serverTarget = (0, devkit_1.parseTargetString)(options.serverTarget, context);
    const browserOptions = (0, devkit_1.readTargetOptions)(browserTarget, context);
    const serverOptions = (0, devkit_1.readTargetOptions)(serverTarget, context);
    const runBrowser = await (0, devkit_1.runExecutor)(browserTarget, { ...browserOptions, ...options.browserTargetOptions }, context);
    const runServer = await (0, devkit_1.runExecutor)(serverTarget, { ...serverOptions, ...options.serverTargetOptions }, context);
    let browserBuilt = false;
    let nodeStarted = false;
    const combined = (0, async_iterable_1.combineAsyncIterables)(runBrowser, runServer);
    for await (const output of combined) {
        if (!output.success)
            throw new Error('Could not build application');
        if (output.options?.target === 'node') {
            nodeStarted = true;
        }
        else if (output.options?.target === 'web') {
            browserBuilt = true;
        }
        if (nodeStarted && browserBuilt) {
            await (0, wait_until_server_is_listening_1.waitUntilServerIsListening)(options.port);
            console.log(`[ ${pc.green('ready')} ] on http://localhost:${options.port}`);
            yield {
                ...output,
                baseUrl: `http://localhost:${options.port}`,
            };
        }
    }
}
exports.default = ssrDevServerExecutor;
