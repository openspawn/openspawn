import { Compiler } from 'webpack';
import { ExtraEntryPoint } from '../utils/models';
export interface WriteIndexHtmlOptions {
    indexPath: string;
    outputPath: string;
    baseHref?: string;
    deployUrl?: string;
    sri?: boolean;
    scripts?: ExtraEntryPoint[];
    styles?: ExtraEntryPoint[];
    crossOrigin?: 'none' | 'anonymous' | 'use-credentials';
}
export declare class WriteIndexHtmlPlugin {
    private readonly options;
    constructor(options: WriteIndexHtmlOptions);
    apply(compiler: Compiler): void;
    private getEmittedFiles;
    private stripBom;
    private augmentIndexHtml;
    private generateSriAttributes;
    private filterAndMapBuildFiles;
}
//# sourceMappingURL=write-index-html-plugin.d.ts.map