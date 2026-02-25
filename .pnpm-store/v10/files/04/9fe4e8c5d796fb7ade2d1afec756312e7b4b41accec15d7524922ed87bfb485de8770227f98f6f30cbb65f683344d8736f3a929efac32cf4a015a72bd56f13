import { Logger, Version } from '@verdaccio/types';
type Results = any;
declare class SearchMemoryIndexer {
    private database;
    private storage;
    private logger;
    /**
     * Set up the {Storage}
     * @param {*} storage An storage reference.
     */
    configureStorage(storage: any): void;
    /**
     * Performs a query to the indexer.
     * If the keyword is a * it returns all local elements
     * otherwise performs a search
     * @param {*} q the keyword
     * @return {Array} list of results.
     */
    query(term: string): Promise<Results | void>;
    private prepareKeywords;
    /**
     * Add a new element to index
     * @param {*} pkg the package
     */
    add(pkg: Version): Promise<void>;
    /**
     * Remove an element from the index.
     * @param {*} name the id element
     */
    remove(name: string): Promise<void>;
    /**
     * Force a re-index.
     */
    reindex(): Promise<void>;
    init(logger: Logger): Promise<void>;
}
declare const _default: SearchMemoryIndexer;
export default _default;
export { Results };
