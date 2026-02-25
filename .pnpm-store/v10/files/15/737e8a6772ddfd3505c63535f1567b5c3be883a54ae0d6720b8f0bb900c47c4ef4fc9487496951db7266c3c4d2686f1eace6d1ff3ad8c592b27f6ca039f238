"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebpackNxBuildCoordinationPlugin = void 0;
const child_process_1 = require("child_process");
const client_1 = require("nx/src/daemon/client/client");
const watch_1 = require("nx/src/command-line/watch/watch");
const output_1 = require("nx/src/utils/output");
class WebpackNxBuildCoordinationPlugin {
    constructor(buildCmd, skipInitialBuildOrOptions) {
        this.buildCmd = buildCmd;
        this.currentlyRunning = 'none';
        this.buildCmdProcess = null;
        const options = typeof skipInitialBuildOrOptions === 'boolean'
            ? { skipInitialBuild: skipInitialBuildOrOptions }
            : skipInitialBuildOrOptions;
        if (!options?.skipInitialBuild) {
            this.buildChangedProjects();
        }
        if (!options?.skipWatchingDeps) {
            if ((0, client_1.isDaemonEnabled)()) {
                this.startWatchingBuildableLibs();
            }
            else {
                output_1.output.warn({
                    title: 'Nx Daemon is not enabled. Buildable libs will not be rebuilt on file changes.',
                });
            }
        }
    }
    apply(compiler) {
        compiler.hooks.beforeCompile.tapPromise('IncrementalDevServerPlugin', async () => {
            while (this.currentlyRunning === 'nx-build') {
                await sleep(50);
            }
            this.currentlyRunning = 'webpack-build';
        });
        compiler.hooks.done.tapPromise('IncrementalDevServerPlugin', async () => {
            this.currentlyRunning = 'none';
        });
    }
    async startWatchingBuildableLibs() {
        const unregisterFileWatcher = await this.createFileWatcher();
        process.on('exit', () => {
            unregisterFileWatcher();
        });
    }
    async buildChangedProjects() {
        while (this.currentlyRunning === 'webpack-build') {
            await sleep(50);
        }
        this.currentlyRunning = 'nx-build';
        try {
            return await new Promise((res) => {
                this.buildCmdProcess = (0, child_process_1.exec)(this.buildCmd, {
                    windowsHide: false,
                });
                this.buildCmdProcess.stdout.pipe(process.stdout);
                this.buildCmdProcess.stderr.pipe(process.stderr);
                this.buildCmdProcess.on('exit', () => {
                    res();
                });
                this.buildCmdProcess.on('error', () => {
                    res();
                });
            });
        }
        finally {
            this.currentlyRunning = 'none';
            this.buildCmdProcess = null;
        }
    }
    createFileWatcher() {
        const runner = new watch_1.BatchFunctionRunner(() => this.buildChangedProjects());
        return client_1.daemonClient.registerFileWatcher({
            watchProjects: 'all',
        }, (err, { changedProjects, changedFiles }) => {
            if (err === 'reconnecting') {
                // Silent - daemon restarts automatically on lockfile changes
                return;
            }
            else if (err === 'reconnected') {
                // Silent - reconnection succeeded
                return;
            }
            else if (err === 'closed') {
                output_1.output.error({
                    title: 'Failed to reconnect to daemon after multiple attempts',
                });
                process.exit(1);
            }
            else if (err) {
                output_1.output.error({
                    title: `Watch error: ${err?.message ?? 'Unknown'}`,
                });
            }
            if (this.buildCmdProcess) {
                this.buildCmdProcess.kill(2);
                this.buildCmdProcess = null;
            }
            // Queue a build
            runner.enqueue(changedProjects, changedFiles);
        });
    }
}
exports.WebpackNxBuildCoordinationPlugin = WebpackNxBuildCoordinationPlugin;
function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
