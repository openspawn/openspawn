import { Application } from 'express';
import { Callback, ConfigYaml } from '@verdaccio/types';
/**
 * Trigger the server after configuration has been loaded.
 * @param {Object} config
 * @param {Object} cliArguments
 * @param {String} configPath
 * @param {String} pkgVersion
 * @param {String} pkgName
 * @deprecated use runServer instead
 */
declare function startVerdaccio(config: ConfigYaml, cliListen: string, configPath: string, pkgVersion: string, pkgName: string, callback: Callback): void;
/**
 *
 * @param webServer
 * @param addr
 * @param pkgName
 * @param pkgVersion
 * @deprecated use initServer instead
 */
declare function listenDefaultCallback(webServer: Application, addr: any, pkgName: string, pkgVersion: string): void;
export { startVerdaccio, listenDefaultCallback };
