import { HardcodedFetch } from './config.js';
import { FetcherRenderer, type GenerateConfig } from './fetcher.js';
import { ReactQueryVisitor } from './visitor.js';
export declare class HardcodedFetchFetcher extends FetcherRenderer {
    protected visitor: ReactQueryVisitor;
    private config;
    constructor(visitor: ReactQueryVisitor, config: HardcodedFetch);
    private getEndpoint;
    private getFetchParams;
    generateFetcherImplementation(): string;
    generateInfiniteQueryHook(config: GenerateConfig, isSuspense?: boolean): string;
    generateQueryHook(config: GenerateConfig, isSuspense?: boolean): string;
    generateMutationHook(config: GenerateConfig): string;
    generateFetcherFetch(config: GenerateConfig): string;
}
