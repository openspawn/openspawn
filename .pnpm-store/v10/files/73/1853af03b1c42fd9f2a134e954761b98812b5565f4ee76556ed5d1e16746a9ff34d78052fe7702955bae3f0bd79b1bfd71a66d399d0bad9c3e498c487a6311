import type { Compiler, Compilation } from 'webpack';
import type { ConsumeSharedPluginOptions } from '../../declarations/plugins/sharing/ConsumeSharedPlugin';
import ConsumeSharedModule from './ConsumeSharedModule';
import type { ConsumeOptions } from '../../declarations/plugins/sharing/ConsumeSharedModule';
declare class ConsumeSharedPlugin {
    private _consumes;
    constructor(options: ConsumeSharedPluginOptions);
    createConsumeSharedModule(compilation: Compilation, context: string, request: string, config: ConsumeOptions): Promise<ConsumeSharedModule>;
    apply(compiler: Compiler): void;
}
export default ConsumeSharedPlugin;
