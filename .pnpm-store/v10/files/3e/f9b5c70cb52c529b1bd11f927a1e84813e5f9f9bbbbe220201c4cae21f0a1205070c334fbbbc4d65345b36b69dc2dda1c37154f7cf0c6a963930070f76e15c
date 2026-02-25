import { FetcherRenderer, type GenerateConfig } from './fetcher.cjs';
import { ReactQueryVisitor } from './visitor.cjs';
export declare class FetchFetcher extends FetcherRenderer {
    protected visitor: ReactQueryVisitor;
    constructor(visitor: ReactQueryVisitor);
    generateFetcherImplementation(): string;
    generateInfiniteQueryHook(config: GenerateConfig, isSuspense?: boolean): string;
    generateQueryHook(config: GenerateConfig, isSuspense?: boolean): string;
    generateMutationHook(config: GenerateConfig): string;
    generateFetcherFetch(config: GenerateConfig): string;
}
