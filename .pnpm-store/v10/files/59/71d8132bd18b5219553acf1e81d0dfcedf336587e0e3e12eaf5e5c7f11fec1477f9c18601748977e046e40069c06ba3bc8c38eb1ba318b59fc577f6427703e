import { Config as AppConfig, AuthConf, ConfigYaml, FlagsConfig, PackageAccess, PackageList, RateLimit, Security, ServerSettingsConf } from '@verdaccio/types';
export declare const WEB_TITLE = "Verdaccio";
export declare const defaultUserRateLimiting: {
    windowMs: number;
    max: number;
};
export declare function isNodeVersionGreaterThan21(): boolean;
/**
 * Coordinates the application configuration
 */
declare class Config implements AppConfig {
    user_agent: string | undefined;
    uplinks: any;
    packages: PackageList;
    users: any;
    auth: AuthConf;
    store: any;
    server_id: string;
    configPath: string;
    /**
     * @deprecated use configPath or config.getConfigPath();
     */
    self_path: string;
    storage: string | void;
    plugins: string | void | null;
    security: Security;
    server: ServerSettingsConf;
    private configOverrideOptions;
    secret: string;
    flags: FlagsConfig;
    userRateLimit: RateLimit;
    constructor(config: ConfigYaml & {
        config_path: string;
    }, configOverrideOptions?: {
        forceMigrateToSecureLegacySignature: boolean;
    });
    getMigrateToSecureLegacySignature(): boolean;
    getConfigPath(): string;
    /**
     * Check for package spec
     * @param pkgName - package name
     * @returns package access
     * @deprecated use core.authUtils instead
     */
    getMatchedPackagesSpec(pkgName: string): PackageAccess | void;
    /**
     * Verify if the secret complies with the required structure
     *  - If the secret is not provided, it will generate a new one
     *    - For any Node.js version the new secret will be 32 characters long (to allow compatibility with modern Node.js versions)
     *  - If the secret is provided:
     *    - If Node.js 22 or higher, the secret must be 32 characters long thus the application will fail on startup
     *    - If Node.js 21 or lower, the secret will be used as is but will display a deprecation warning
     *    - If the property `security.api.migrateToSecureLegacySignature` is provided and set to true, the secret will be
     *      generated with the new signature model
     * @secret external secret key
     */
    checkSecretKey(secret?: string): string;
}
export { Config };
