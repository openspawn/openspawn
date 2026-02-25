import { type Express } from 'express';
import type { Auth } from '@verdaccio/auth';
import { pluginUtils } from '@verdaccio/core';
import { Logger } from '@verdaccio/types';
import { ConfigAudit } from './types';
export declare const REGISTRY_DOMAIN = "https://registry.npmjs.org";
export default class ProxyAudit extends pluginUtils.Plugin<ConfigAudit> implements pluginUtils.ExpressMiddleware<ConfigAudit, {}, Auth> {
    enabled: boolean;
    logger: Logger;
    strict_ssl: boolean;
    timeout: number;
    constructor(config: ConfigAudit, options: pluginUtils.PluginOptions);
    register_middlewares(app: Express, auth: Auth): void;
}
