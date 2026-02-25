import { getCSSModuleLocalIdent } from '../../../utils/get-css-module-local-ident';
import { NormalizedNxAppWebpackPluginOptions } from '../nx-app-webpack-plugin-options';
interface PostcssOptions {
    (loader: any): any;
    config?: string;
}
export declare function getCommonLoadersForCssModules(options: NormalizedNxAppWebpackPluginOptions, includePaths: string[]): ({
    loader: any;
    options?: undefined;
} | {
    loader: string;
    options: {
        modules: {
            mode: string;
            getLocalIdent: typeof getCSSModuleLocalIdent;
        };
        importLoaders: number;
        implementation?: undefined;
        postcssOptions?: undefined;
    };
} | {
    loader: string;
    options: {
        implementation: any;
        postcssOptions: PostcssOptions;
        modules?: undefined;
        importLoaders?: undefined;
    };
})[];
export declare function getCommonLoadersForGlobalCss(options: NormalizedNxAppWebpackPluginOptions, includePaths: string[]): ({
    loader: any;
    options?: undefined;
} | {
    loader: string;
    options: {
        url: boolean;
        implementation?: undefined;
        postcssOptions?: undefined;
    };
} | {
    loader: string;
    options: {
        implementation: any;
        postcssOptions: PostcssOptions;
        url?: undefined;
    };
})[];
export declare function getCommonLoadersForGlobalStyle(options: NormalizedNxAppWebpackPluginOptions, includePaths: string[]): ({
    loader: any;
    options: {
        esModule: boolean;
        url?: undefined;
        implementation?: undefined;
        postcssOptions?: undefined;
    };
} | {
    loader: string;
    options: {
        url: boolean;
        esModule?: undefined;
        implementation?: undefined;
        postcssOptions?: undefined;
    };
} | {
    loader: string;
    options: {
        implementation: any;
        postcssOptions: PostcssOptions;
        esModule?: undefined;
        url?: undefined;
    };
})[];
export {};
//# sourceMappingURL=stylesheet-loaders.d.ts.map