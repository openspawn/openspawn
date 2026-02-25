import { CustomFetch } from './config.js';
import { FetcherRenderer, type GenerateConfig } from './fetcher.js';
import { ReactQueryVisitor } from './visitor.js';
export declare class CustomMapperFetcher extends FetcherRenderer {
    protected visitor: ReactQueryVisitor;
    private _mapper;
    private _isReactHook;
    constructor(visitor: ReactQueryVisitor, customFetcher: CustomFetch);
    private getFetcherFnName;
    generateFetcherImplementation(): string;
    generateInfiniteQueryHook(config: GenerateConfig, isSuspense?: boolean): string;
    generateQueryHook(config: GenerateConfig, isSuspense?: boolean): string;
    generateMutationHook(config: GenerateConfig): string;
    generateFetcherFetch(config: GenerateConfig): string;
}
