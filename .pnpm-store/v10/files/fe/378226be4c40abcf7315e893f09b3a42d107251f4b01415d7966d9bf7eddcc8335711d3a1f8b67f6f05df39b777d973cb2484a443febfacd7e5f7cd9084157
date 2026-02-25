import { type Tree } from '@nx/devkit';
import { logger as devkitLogger } from 'nx/src/devkit-exports';
interface Schema {
    project?: string;
    skipFormat?: boolean;
}
export declare function convertToInferred(tree: Tree, options: Schema): Promise<import("@nx/devkit").GeneratorCallback>;
export declare function createCollectingLogger(): typeof devkitLogger & {
    loggedMessages: Map<string, string[]>;
    flushLogs: (filter?: (message: string) => boolean) => void;
};
export {};
//# sourceMappingURL=convert-to-inferred.d.ts.map