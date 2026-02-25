import { NxComposableWebpackPlugin } from './config';
import { ExtraEntryPointClass, NormalizedWebpackExecutorOptions } from '../executors/webpack/schema';
export interface WithWebOptions {
    baseHref?: string;
    crossOrigin?: 'none' | 'anonymous' | 'use-credentials';
    deployUrl?: string;
    extractCss?: boolean;
    generateIndexHtml?: boolean;
    index?: string;
    postcssConfig?: string;
    scripts?: Array<ExtraEntryPointClass | string>;
    stylePreprocessorOptions?: {
        includePaths?: string[];
        sassOptions?: Record<string, any>;
        lessOptions?: Record<string, any>;
    };
    styles?: Array<ExtraEntryPointClass | string>;
    subresourceIntegrity?: boolean;
    ssr?: boolean;
}
export type MergedOptions = Omit<NormalizedWebpackExecutorOptions, keyof WithWebOptions> & WithWebOptions;
/**
 * @param {WithWebOptions} pluginOptions
 * @returns {NxWebpackPlugin}
 */
export declare function withWeb(pluginOptions?: WithWebOptions): NxComposableWebpackPlugin;
//# sourceMappingURL=with-web.d.ts.map