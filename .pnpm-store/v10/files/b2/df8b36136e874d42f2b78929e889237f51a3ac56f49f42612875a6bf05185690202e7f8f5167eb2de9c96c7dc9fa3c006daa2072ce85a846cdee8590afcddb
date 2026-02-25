"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactQueryVisitor = void 0;
const tslib_1 = require("tslib");
const auto_bind_1 = tslib_1.__importDefault(require("auto-bind"));
const change_case_all_1 = require("change-case-all");
const visitor_plugin_common_1 = require("@graphql-codegen/visitor-plugin-common");
const fetcher_custom_mapper_js_1 = require("./fetcher-custom-mapper.js");
const fetcher_fetch_hardcoded_js_1 = require("./fetcher-fetch-hardcoded.js");
const fetcher_fetch_js_1 = require("./fetcher-fetch.js");
const fetcher_graphql_request_js_1 = require("./fetcher-graphql-request.js");
class ReactQueryVisitor extends visitor_plugin_common_1.ClientSideBaseVisitor {
    constructor(schema, fragments, rawConfig, documents) {
        const defaultReactQueryVersion = !rawConfig.reactQueryVersion && rawConfig.legacyMode ? 3 : 4;
        super(schema, fragments, rawConfig, {
            documentMode: visitor_plugin_common_1.DocumentMode.string,
            errorType: (0, visitor_plugin_common_1.getConfigValue)(rawConfig.errorType, 'unknown'),
            exposeDocument: (0, visitor_plugin_common_1.getConfigValue)(rawConfig.exposeDocument, false),
            exposeQueryKeys: (0, visitor_plugin_common_1.getConfigValue)(rawConfig.exposeQueryKeys, false),
            exposeQueryRootKeys: (0, visitor_plugin_common_1.getConfigValue)(rawConfig.exposeQueryRootKeys, false),
            exposeMutationKeys: (0, visitor_plugin_common_1.getConfigValue)(rawConfig.exposeMutationKeys, false),
            exposeFetcher: (0, visitor_plugin_common_1.getConfigValue)(rawConfig.exposeFetcher, false),
            addInfiniteQuery: (0, visitor_plugin_common_1.getConfigValue)(rawConfig.addInfiniteQuery, false),
            addSuspenseQuery: (0, visitor_plugin_common_1.getConfigValue)(rawConfig.addSuspenseQuery, false),
            reactQueryVersion: (0, visitor_plugin_common_1.getConfigValue)(rawConfig.reactQueryVersion, defaultReactQueryVersion),
            reactQueryImportFrom: (0, visitor_plugin_common_1.getConfigValue)(rawConfig.reactQueryImportFrom, ''),
        });
        this.rawConfig = rawConfig;
        this.reactQueryHookIdentifiersInUse = new Set();
        this.reactQueryOptionsIdentifiersInUse = new Set();
        this._externalImportPrefix = this.config.importOperationTypesFrom
            ? `${this.config.importOperationTypesFrom}.`
            : '';
        this._documents = documents;
        this.fetcher = this.createFetcher(rawConfig.fetcher || 'fetch');
        (0, auto_bind_1.default)(this);
    }
    get imports() {
        return this._imports;
    }
    createFetcher(raw) {
        if (raw === 'fetch') {
            return new fetcher_fetch_js_1.FetchFetcher(this);
        }
        if (typeof raw === 'object' && 'endpoint' in raw) {
            return new fetcher_fetch_hardcoded_js_1.HardcodedFetchFetcher(this, raw);
        }
        if (raw === 'graphql-request' || (typeof raw === 'object' && 'clientImportPath' in raw)) {
            return new fetcher_graphql_request_js_1.GraphQLRequestClientFetcher(this, raw);
        }
        return new fetcher_custom_mapper_js_1.CustomMapperFetcher(this, raw);
    }
    get hasOperations() {
        return this._collectedOperations.length > 0;
    }
    getImports() {
        const baseImports = super.getImports();
        if (!this.hasOperations) {
            return baseImports;
        }
        const hookAndTypeImports = [
            ...Array.from(this.reactQueryHookIdentifiersInUse),
            ...Array.from(this.reactQueryOptionsIdentifiersInUse).map(identifier => `${this.config.useTypeImports ? 'type ' : ''}${identifier}`),
        ];
        const moduleName = this.config.reactQueryImportFrom
            ? this.config.reactQueryImportFrom
            : this.config.reactQueryVersion <= 3
                ? 'react-query'
                : '@tanstack/react-query';
        return [...baseImports, `import { ${hookAndTypeImports.join(', ')} } from '${moduleName}';`];
    }
    getFetcherImplementation() {
        return this.fetcher.generateFetcherImplementation();
    }
    _getHookSuffix(name, operationType) {
        if (this.config.omitOperationSuffix) {
            return '';
        }
        if (!this.config.dedupeOperationSuffix) {
            return (0, change_case_all_1.pascalCase)(operationType);
        }
        if (name.includes('Query') || name.includes('Mutation') || name.includes('Subscription')) {
            return '';
        }
        return (0, change_case_all_1.pascalCase)(operationType);
    }
    buildOperation(node, documentVariableName, operationType, operationResultType, operationVariablesTypes, hasRequiredVariables) {
        var _a, _b;
        const nodeName = (_b = (_a = node.name) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : '';
        const suffix = this._getHookSuffix(nodeName, operationType);
        const operationName = this.convertName(nodeName, {
            suffix,
            useTypesPrefix: false,
            useTypesSuffix: false,
        });
        const generateConfig = {
            node,
            documentVariableName,
            operationResultType: this._externalImportPrefix + operationResultType,
            operationVariablesTypes: this._externalImportPrefix + operationVariablesTypes,
            hasRequiredVariables,
            operationName,
        };
        const queries = [];
        const getOutputFromQueries = () => `\n${queries.join('\n\n')}\n`;
        if (operationType === 'Query') {
            const addQuery = (generateConfig, isSuspense = false) => {
                const { hook, getKey, rootKey, document } = this.fetcher.generateQueryOutput(generateConfig, isSuspense);
                queries.push(hook);
                if (this.config.exposeDocument)
                    queries.push(document);
                if (this.config.exposeQueryKeys)
                    queries.push(getKey);
                if (this.config.exposeQueryRootKeys)
                    queries.push(rootKey);
            };
            addQuery(generateConfig);
            if (this.config.addSuspenseQuery)
                addQuery(generateConfig, true);
            if (this.config.addInfiniteQuery) {
                const addInfiniteQuery = (generateConfig, isSuspense = false) => {
                    const { hook, getKey, rootKey } = this.fetcher.generateInfiniteQueryOutput(generateConfig, isSuspense);
                    queries.push(hook);
                    if (this.config.exposeQueryKeys)
                        queries.push(getKey);
                    if (this.config.exposeQueryRootKeys)
                        queries.push(rootKey);
                };
                addInfiniteQuery(generateConfig);
                if (this.config.addSuspenseQuery) {
                    addInfiniteQuery(generateConfig, true);
                }
            }
            // The reason we're looking at the private field of the CustomMapperFetcher to see if it's a react hook
            // is to prevent calling generateFetcherFetch for each query since all the queries won't be able to generate
            // a fetcher field anyways.
            if (this.config.exposeFetcher && !this.fetcher._isReactHook) {
                queries.push(this.fetcher.generateFetcherFetch(generateConfig));
            }
            return getOutputFromQueries();
        }
        if (operationType === 'Mutation') {
            const { hook, getKey } = this.fetcher.generateMutationOutput(generateConfig);
            queries.push(hook);
            if (this.config.exposeMutationKeys)
                queries.push(getKey);
            if (this.config.exposeFetcher && !this.fetcher._isReactHook) {
                queries.push(this.fetcher.generateFetcherFetch(generateConfig));
            }
            return getOutputFromQueries();
        }
        if (operationType === 'Subscription') {
            // eslint-disable-next-line no-console
            console.warn(`Plugin "typescript-react-query" does not support GraphQL Subscriptions at the moment! Ignoring "${node.name.value}"...`);
        }
        return null;
    }
}
exports.ReactQueryVisitor = ReactQueryVisitor;
