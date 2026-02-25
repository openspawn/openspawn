import { AuthConf, ConfigYaml, LoggerConfigItem, PackageAccessYaml, Security, UpLinkConf } from '@verdaccio/types';
/**
 * Helper configuration builder constructor, used to build the configuration for testing or
 * programatically creating a configuration.
 */
export default class ConfigBuilder {
    private config;
    constructor(config?: Partial<ConfigYaml>);
    static build(config?: Partial<ConfigYaml>): ConfigBuilder;
    addPackageAccess(pattern: string, pkgAccess: PackageAccessYaml): this;
    addUplink(id: string, uplink: UpLinkConf): this;
    addSecurity(security: Partial<Security>): this;
    addAuth(auth: Partial<AuthConf>): this;
    addLogger(log: LoggerConfigItem): this;
    addStorage(storage: string | object): this;
    getConfig(): ConfigYaml;
    getAsYaml(): string;
}
