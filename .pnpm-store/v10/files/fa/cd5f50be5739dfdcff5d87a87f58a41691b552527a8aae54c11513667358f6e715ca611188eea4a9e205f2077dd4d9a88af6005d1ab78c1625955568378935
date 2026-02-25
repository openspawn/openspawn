'use strict';

var commander = require('commander');
var dtsPlugin = require('@module-federation/dts-plugin');
var sdk = require('@module-federation/sdk');
var chalk = require('chalk');
var path = require('path');

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

const applyCommonOptions = (command) => {
    command.option('-c --config <config>', 'specify the configuration file, can be a relative or absolute path');
    command.option('-m --mode <mode>', 'Specify the runtime environment. You can choose "dev" or "prod". The default value is "dev". After setting, the process.env.NODE_ENV environment variable will be automatically injected with "development" or "production" according to the value.', (value) => {
        const validChoices = {
            dev: 'development',
            prod: 'production',
        };
        if (!Object.keys(validChoices).includes(value)) {
            throw new Error(`Invalid mode: ${value}. Valid choices are: ${Object.keys(validChoices).join(', ')}`);
        }
        const targetEnv = validChoices[value];
        if (process.env.NODE_ENV !== targetEnv) {
            console.log(`process.env.NODE_ENV is set to ${targetEnv}`);
        }
        process.env.NODE_ENV = targetEnv;
        return value;
    }, 'dev');
};

const PREFIX = '[ Module Federation CLI ]';
const logger = sdk.createLogger(chalk `{bold {cyan ${PREFIX}}}`);

function dts(options_1, _a) {
    return __awaiter(this, arguments, void 0, function* (options, { readConfig }) {
        const { fetch = true, generate = true, root = process.cwd(), output, config, } = options;
        const mfConfig = yield readConfig(config);
        if (!dtsPlugin.isTSProject(mfConfig.dts, root)) {
            logger.error('dts is only supported for TypeScript projects');
            return;
        }
        const normalizedDtsOptions = dtsPlugin.normalizeDtsOptions(mfConfig, root, {
            defaultGenerateOptions: {
                generateAPITypes: true,
                compileInChildProcess: false,
                abortOnError: true,
                extractThirdParty: false,
                extractRemoteTypes: false,
            },
            defaultConsumeOptions: {
                abortOnError: true,
                consumeAPITypes: true,
            },
        });
        if (!normalizedDtsOptions) {
            logger.error('dts is not enabled in module-federation.config.ts');
            return;
        }
        if (fetch) {
            const dtsManagerOptions = dtsPlugin.normalizeConsumeTypesOptions({
                context: root,
                dtsOptions: normalizedDtsOptions,
                pluginOptions: mfConfig,
            });
            if (!dtsManagerOptions) {
                logger.warn('dts.consumeTypes is not enabled in module-federation.config.ts, skip fetching remote types');
            }
            else {
                logger.debug('start fetching remote types...');
                yield dtsPlugin.consumeTypesAPI(dtsManagerOptions);
                logger.debug('fetch remote types success!');
            }
        }
        if (generate) {
            const dtsManagerOptions = dtsPlugin.normalizeGenerateTypesOptions({
                context: root,
                outputDir: output,
                dtsOptions: normalizedDtsOptions,
                pluginOptions: mfConfig,
            });
            if (!dtsManagerOptions) {
                logger.warn('dts.generateTypes is not enabled in module-federation.config.ts, skip generating types');
                return;
            }
            logger.debug('start generating types...');
            yield dtsPlugin.generateTypesAPI({ dtsManagerOptions });
            logger.debug('generate types success!');
        }
    });
}

function prepareCli({ welcomeMsg }) {
    if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'development';
    }
    const { npm_execpath } = process.env;
    if (!npm_execpath ||
        npm_execpath.includes('npx-cli.js') ||
        npm_execpath.includes('.bun')) {
        console.log();
    }
    logger.info(welcomeMsg);
}

const { createJiti } = require('jiti');
const DEFAULT_CONFIG_PATH = 'module-federation.config.ts';
const getConfigPath = (userConfigPath) => {
    const defaultPath = path.resolve(process.cwd(), DEFAULT_CONFIG_PATH);
    const filepath = userConfigPath !== null && userConfigPath !== void 0 ? userConfigPath : defaultPath;
    return path.isAbsolute(filepath)
        ? filepath
        : path.resolve(process.cwd(), filepath);
};
function readConfig(userConfigPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const configPath = getConfigPath(userConfigPath);
        const jit = createJiti(__filename, {
            interopDefault: true,
            esmResolve: true,
        });
        const configModule = yield jit(configPath);
        const resolvedConfig = (configModule &&
            typeof configModule === 'object' &&
            'default' in configModule
            ? configModule.default
            : configModule);
        return resolvedConfig;
    });
}

function cli(cliOptions) {
    const { name, version, applyCommands } = cliOptions;
    commander.program.name(name).usage('<command> [options]').version(version);
    const dtsCommand = commander.program.command('dts');
    dtsCommand
        .option('--root <root>', 'specify the project root directory')
        .option('--output <output>', 'specify the generated dts output directory')
        .option('--fetch <boolean>', 'fetch types from remote, default is true', (value) => value === 'true', true)
        .option('--generate <boolean>', 'generate types, default is true', (value) => value === 'true', true);
    applyCommonOptions(dtsCommand);
    dtsCommand
        .description('generate or fetch the mf types')
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        try {
            yield dts(options, cliOptions);
        }
        catch (err) {
            console.error(err);
            process.exit(1);
        }
    }));
    if (typeof applyCommands === 'function') {
        applyCommands(commander.program, applyCommonOptions);
    }
    commander.program.parse();
}
function runCli(options) {
    const normalizedOptions = Object.assign({ loggerPrefix: PREFIX, welcomeMsg: `${`Module Federation v${"0.21.6"}`}\n`, name: 'mf', readConfig, version: "0.21.6", applyCommands: () => { } }, options);
    logger.setPrefix(normalizedOptions.loggerPrefix);
    prepareCli(normalizedOptions);
    try {
        cli(normalizedOptions);
    }
    catch (err) {
        console.error(err);
    }
}

exports.runCli = runCli;
//# sourceMappingURL=index.cjs.js.map
