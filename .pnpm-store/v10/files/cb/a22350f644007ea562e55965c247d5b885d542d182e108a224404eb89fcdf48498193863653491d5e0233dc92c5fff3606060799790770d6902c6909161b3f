import { moduleFederationPlugin } from '@module-federation/sdk';
import { WebpackPluginInstance, Compiler } from 'webpack';
import { D as DTSManagerOptions } from './DTSManagerOptions-QVchWb0x.js';
export { i as isTSProject } from './utils-DxGrqb9N.js';
import './DTSManager-b15Gfat3.js';
import 'typescript';

declare const normalizeDtsOptions: (options: moduleFederationPlugin.ModuleFederationPluginOptions, context: string, defaultOptions?: {
    defaultGenerateOptions?: moduleFederationPlugin.DtsRemoteOptions;
    defaultConsumeOptions?: moduleFederationPlugin.DtsHostOptions;
}) => false | moduleFederationPlugin.PluginDtsOptions;
declare class DtsPlugin implements WebpackPluginInstance {
    options: moduleFederationPlugin.ModuleFederationPluginOptions;
    clonedOptions: moduleFederationPlugin.ModuleFederationPluginOptions;
    constructor(options: moduleFederationPlugin.ModuleFederationPluginOptions);
    apply(compiler: Compiler): void;
    addRuntimePlugins(): void;
}

declare const normalizeConsumeTypesOptions: ({ context, dtsOptions, pluginOptions, }: {
    context?: string;
    dtsOptions: moduleFederationPlugin.PluginDtsOptions;
    pluginOptions: moduleFederationPlugin.ModuleFederationPluginOptions;
}) => {
    host: {
        typesFolder?: string;
        abortOnError?: boolean;
        remoteTypesFolder?: string;
        deleteTypesFolder?: boolean;
        maxRetries?: number;
        consumeAPITypes?: boolean;
        runtimePkgs?: string[];
        remoteTypeUrls?: (() => Promise<moduleFederationPlugin.RemoteTypeUrls>) | moduleFederationPlugin.RemoteTypeUrls;
        timeout?: number;
        family?: 4 | 6;
        typesOnBuild?: boolean;
        implementation: string;
        context: string;
        moduleFederationConfig: moduleFederationPlugin.ModuleFederationPluginOptions;
    };
    extraOptions: Record<string, any>;
    displayErrorInTerminal: boolean;
};
declare const consumeTypesAPI: (dtsManagerOptions: DTSManagerOptions, cb?: (options: moduleFederationPlugin.RemoteTypeUrls) => void) => Promise<void>;

declare const normalizeGenerateTypesOptions: ({ context, outputDir, dtsOptions, pluginOptions, }: {
    context?: string;
    outputDir?: string;
    dtsOptions: moduleFederationPlugin.PluginDtsOptions;
    pluginOptions: moduleFederationPlugin.ModuleFederationPluginOptions;
}) => DTSManagerOptions;
declare const generateTypesAPI: ({ dtsManagerOptions, }: {
    dtsManagerOptions: DTSManagerOptions;
}) => Promise<void>;

export { DtsPlugin, consumeTypesAPI, generateTypesAPI, normalizeConsumeTypesOptions, normalizeDtsOptions, normalizeGenerateTypesOptions };
