import type { moduleFederationPlugin } from '@module-federation/sdk';
import type { Compiler } from 'webpack';
export declare const PLUGIN_NAME = "SharedContainerPlugin";
export type SharedContainerPluginOptions = {
    mfName: string;
    shareName: string;
    version: string;
    request: string;
    library?: moduleFederationPlugin.LibraryOptions;
    independentShareFileName?: string;
};
declare class SharedContainerPlugin {
    name: string;
    filename: string;
    _options: {
        name: string;
        request: string;
        version: string;
        fileName: string;
        library: moduleFederationPlugin.LibraryOptions;
    };
    _shareName: string;
    _globalName: string;
    constructor(options: SharedContainerPluginOptions);
    getData(): string[];
    apply(compiler: Compiler): void;
}
export default SharedContainerPlugin;
