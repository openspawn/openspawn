'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var graphql = require('graphql');

// src/legacy/classes/ClientError.ts
var ClientError = class _ClientError extends Error {
  response;
  request;
  constructor(response, request2) {
    const message = `${_ClientError.extractMessage(response)}: ${JSON.stringify({
      response,
      request: request2
    })}`;
    super(message);
    Object.setPrototypeOf(this, _ClientError.prototype);
    this.response = response;
    this.request = request2;
    if (typeof Error.captureStackTrace === `function`) {
      Error.captureStackTrace(this, _ClientError);
    }
  }
  static extractMessage(response) {
    return response.errors?.[0]?.message ?? `GraphQL Error (Code: ${String(response.status)})`;
  }
};

// src/lib/prelude.ts
var uppercase = (str) => str.toUpperCase();
var callOrIdentity = (value) => {
  return typeof value === `function` ? value() : value;
};
var zip = (a, b) => a.map((k, i) => [k, b[i]]);
var HeadersInitToPlainObject = (headers) => {
  let oHeaders = {};
  if (headers instanceof Headers) {
    oHeaders = HeadersInstanceToPlainObject(headers);
  } else if (Array.isArray(headers)) {
    headers.forEach(([name, value]) => {
      if (name && value !== void 0) {
        oHeaders[name] = value;
      }
    });
  } else if (headers) {
    oHeaders = headers;
  }
  return oHeaders;
};
var HeadersInstanceToPlainObject = (headers) => {
  const o = {};
  headers.forEach((v, k) => {
    o[k] = v;
  });
  return o;
};
var tryCatch = (fn) => {
  try {
    const result = fn();
    if (isPromiseLikeValue(result)) {
      return result.catch((error) => {
        return errorFromMaybeError(error);
      });
    }
    return result;
  } catch (error) {
    return errorFromMaybeError(error);
  }
};
var errorFromMaybeError = (maybeError) => {
  if (maybeError instanceof Error) return maybeError;
  return new Error(String(maybeError));
};
var isPromiseLikeValue = (value) => {
  return typeof value === `object` && value !== null && `then` in value && typeof value.then === `function` && `catch` in value && typeof value.catch === `function` && `finally` in value && typeof value.finally === `function`;
};
var casesExhausted = (value) => {
  throw new Error(`Unhandled case: ${String(value)}`);
};
var isPlainObject = (value) => {
  return typeof value === `object` && value !== null && !Array.isArray(value);
};

// src/legacy/functions/batchRequests.ts
var batchRequests = async (...args) => {
  const params = parseBatchRequestsArgsExtended(args);
  const client = new GraphQLClient(params.url);
  return client.batchRequests(params);
};
var parseBatchRequestsArgsExtended = (args) => {
  if (args.length === 1) {
    return args[0];
  } else {
    return {
      url: args[0],
      documents: args[1],
      requestHeaders: args[2],
      signal: void 0
    };
  }
};
var parseBatchRequestArgs = (documentsOrOptions, requestHeaders) => {
  return documentsOrOptions.documents ? documentsOrOptions : {
    documents: documentsOrOptions,
    requestHeaders,
    signal: void 0
  };
};

// src/legacy/functions/rawRequest.ts
var rawRequest = async (...args) => {
  const [urlOrOptions, query, ...variablesAndRequestHeaders] = args;
  const requestOptions = parseRawRequestExtendedArgs(urlOrOptions, query, ...variablesAndRequestHeaders);
  const client = new GraphQLClient(requestOptions.url);
  return client.rawRequest({
    ...requestOptions
  });
};
var parseRawRequestExtendedArgs = (urlOrOptions, query, ...variablesAndRequestHeaders) => {
  const [variables, requestHeaders] = variablesAndRequestHeaders;
  return typeof urlOrOptions === `string` ? {
    url: urlOrOptions,
    query,
    variables,
    requestHeaders,
    signal: void 0
  } : urlOrOptions;
};
var parseRawRequestArgs = (queryOrOptions, variables, requestHeaders) => {
  return queryOrOptions.query ? queryOrOptions : {
    query: queryOrOptions,
    variables,
    requestHeaders,
    signal: void 0
  };
};

// src/lib/http.ts
var ACCEPT_HEADER = `Accept`;
var CONTENT_TYPE_HEADER = `Content-Type`;
var CONTENT_TYPE_JSON = `application/json`;
var CONTENT_TYPE_GQL = `application/graphql-response+json`;

// src/legacy/lib/graphql.ts
var cleanQuery = (str) => str.replace(/([\s,]|#[^\n\r]+)+/g, ` `).trim();
var isGraphQLContentType = (contentType) => {
  const contentTypeLower = contentType.toLowerCase();
  return contentTypeLower.includes(CONTENT_TYPE_GQL) || contentTypeLower.includes(CONTENT_TYPE_JSON);
};
var parseGraphQLExecutionResult = (result) => {
  try {
    if (Array.isArray(result)) {
      return {
        _tag: `Batch`,
        executionResults: result.map(parseExecutionResult)
      };
    } else if (isPlainObject(result)) {
      return {
        _tag: `Single`,
        executionResult: parseExecutionResult(result)
      };
    } else {
      throw new Error(`Invalid execution result: result is not object or array. 
Got:
${String(result)}`);
    }
  } catch (e) {
    return e;
  }
};
var parseExecutionResult = (result) => {
  if (typeof result !== `object` || result === null) {
    throw new Error(`Invalid execution result: result is not object`);
  }
  let errors = void 0;
  let data = void 0;
  let extensions = void 0;
  if (`errors` in result) {
    if (!isPlainObject(result.errors) && !Array.isArray(result.errors)) {
      throw new Error(`Invalid execution result: errors is not plain object OR array`);
    }
    errors = result.errors;
  }
  if (`data` in result) {
    if (!isPlainObject(result.data) && result.data !== null) {
      throw new Error(`Invalid execution result: data is not plain object`);
    }
    data = result.data;
  }
  if (`extensions` in result) {
    if (!isPlainObject(result.extensions)) throw new Error(`Invalid execution result: extensions is not plain object`);
    extensions = result.extensions;
  }
  return {
    data,
    errors,
    extensions
  };
};
var isRequestResultHaveErrors = (result) => result._tag === `Batch` ? result.executionResults.some(isExecutionResultHaveErrors) : isExecutionResultHaveErrors(result.executionResult);
var isExecutionResultHaveErrors = (result) => Array.isArray(result.errors) ? result.errors.length > 0 : Boolean(result.errors);
var isOperationDefinitionNode = (definition) => {
  return typeof definition === `object` && definition !== null && `kind` in definition && definition.kind === graphql.Kind.OPERATION_DEFINITION;
};
var extractOperationName = (document) => {
  let operationName = void 0;
  const defs = document.definitions.filter(isOperationDefinitionNode);
  if (defs.length === 1) {
    operationName = defs[0].name?.value;
  }
  return operationName;
};
var extractIsMutation = (document) => {
  let isMutation = false;
  const defs = document.definitions.filter(isOperationDefinitionNode);
  if (defs.length === 1) {
    isMutation = defs[0].operation === `mutation`;
  }
  return isMutation;
};
var analyzeDocument = (document, excludeOperationName) => {
  const normalizedDocument = typeof document === `string` || `kind` in document ? document : String(document);
  const expression = typeof normalizedDocument === `string` ? normalizedDocument : graphql.print(normalizedDocument);
  let isMutation = false;
  let operationName = void 0;
  if (excludeOperationName) {
    return { expression, isMutation, operationName };
  }
  const docNode = tryCatch(
    () => typeof normalizedDocument === `string` ? graphql.parse(normalizedDocument) : normalizedDocument
  );
  if (docNode instanceof Error) {
    return { expression, isMutation, operationName };
  }
  operationName = extractOperationName(docNode);
  isMutation = extractIsMutation(docNode);
  return { expression, operationName, isMutation };
};

// src/legacy/helpers/defaultJsonSerializer.ts
var defaultJsonSerializer = JSON;

// src/legacy/helpers/runRequest.ts
var runRequest = async (input) => {
  const config = {
    ...input,
    method: input.request._tag === `Single` ? input.request.document.isMutation ? `POST` : uppercase(input.method ?? `post`) : input.request.hasMutations ? `POST` : uppercase(input.method ?? `post`),
    fetchOptions: {
      ...input.fetchOptions,
      errorPolicy: input.fetchOptions.errorPolicy ?? `none`
    }
  };
  const fetcher = createFetcher(config.method);
  const fetchResponse = await fetcher(config);
  const body = await fetchResponse.text();
  let result;
  try {
    result = parseResultFromText(
      body,
      fetchResponse.headers.get(CONTENT_TYPE_HEADER),
      input.fetchOptions.jsonSerializer ?? defaultJsonSerializer
    );
  } catch (error) {
    result = error;
  }
  const clientResponseBase = {
    status: fetchResponse.status,
    headers: fetchResponse.headers,
    body
  };
  if (!fetchResponse.ok) {
    if (result instanceof Error) {
      return new ClientError(
        { ...clientResponseBase },
        {
          query: input.request._tag === `Single` ? input.request.document.expression : input.request.query,
          variables: input.request.variables
        }
      );
    }
    const clientResponse = result._tag === `Batch` ? { ...result.executionResults, ...clientResponseBase } : {
      ...result.executionResult,
      ...clientResponseBase
    };
    return new ClientError(clientResponse, {
      query: input.request._tag === `Single` ? input.request.document.expression : input.request.query,
      variables: input.request.variables
    });
  }
  if (result instanceof Error) throw result;
  if (isRequestResultHaveErrors(result) && config.fetchOptions.errorPolicy === `none`) {
    const clientResponse = result._tag === `Batch` ? { ...result.executionResults, ...clientResponseBase } : {
      ...result.executionResult,
      ...clientResponseBase
    };
    return new ClientError(clientResponse, {
      query: input.request._tag === `Single` ? input.request.document.expression : input.request.query,
      variables: input.request.variables
    });
  }
  switch (result._tag) {
    case `Single`:
      return {
        ...clientResponseBase,
        ...executionResultClientResponseFields(config)(result.executionResult)
      };
    case `Batch`:
      return {
        ...clientResponseBase,
        data: result.executionResults.map(executionResultClientResponseFields(config))
      };
    default:
      casesExhausted(result);
  }
};
var executionResultClientResponseFields = ($params) => (executionResult) => {
  return {
    extensions: executionResult.extensions,
    data: executionResult.data,
    errors: $params.fetchOptions.errorPolicy === `all` ? executionResult.errors : void 0
  };
};
var parseResultFromText = (text, contentType, jsonSerializer) => {
  if (contentType && isGraphQLContentType(contentType)) {
    return parseGraphQLExecutionResult(jsonSerializer.parse(text));
  } else {
    return parseGraphQLExecutionResult(text);
  }
};
var createFetcher = (method) => async (params) => {
  const headers = new Headers(params.headers);
  let searchParams = null;
  let body = void 0;
  if (!headers.has(ACCEPT_HEADER)) {
    headers.set(ACCEPT_HEADER, [CONTENT_TYPE_GQL, CONTENT_TYPE_JSON].join(`, `));
  }
  if (method === `POST`) {
    const $jsonSerializer = params.fetchOptions.jsonSerializer ?? defaultJsonSerializer;
    body = $jsonSerializer.stringify(buildBody(params));
    if (typeof body === `string` && !headers.has(CONTENT_TYPE_HEADER)) {
      headers.set(CONTENT_TYPE_HEADER, CONTENT_TYPE_JSON);
    }
  } else {
    searchParams = buildQueryParams(params);
  }
  const init = { method, headers, body, ...params.fetchOptions };
  let url = new URL(params.url);
  let initResolved = init;
  if (params.middleware) {
    const result = await Promise.resolve(
      params.middleware({
        ...init,
        url: params.url,
        operationName: params.request._tag === `Single` ? params.request.document.operationName : void 0,
        variables: params.request.variables
      })
    );
    const { url: urlNew, ...initNew } = result;
    url = new URL(urlNew);
    initResolved = initNew;
  }
  if (searchParams) {
    searchParams.forEach((value, name) => {
      url.searchParams.append(name, value);
    });
  }
  const $fetch = params.fetch ?? fetch;
  return await $fetch(url, initResolved);
};
var buildBody = (params) => {
  switch (params.request._tag) {
    case `Single`:
      return {
        query: params.request.document.expression,
        variables: params.request.variables,
        operationName: params.request.document.operationName
      };
    case `Batch`:
      return zip(params.request.query, params.request.variables ?? []).map(([query, variables]) => ({
        query,
        variables
      }));
    default:
      throw casesExhausted(params.request);
  }
};
var buildQueryParams = (params) => {
  const $jsonSerializer = params.fetchOptions.jsonSerializer ?? defaultJsonSerializer;
  const searchParams = new URLSearchParams();
  switch (params.request._tag) {
    case `Single`: {
      searchParams.append(`query`, cleanQuery(params.request.document.expression));
      if (params.request.variables) {
        searchParams.append(`variables`, $jsonSerializer.stringify(params.request.variables));
      }
      if (params.request.document.operationName) {
        searchParams.append(`operationName`, params.request.document.operationName);
      }
      return searchParams;
    }
    case `Batch`: {
      const variablesSerialized = params.request.variables?.map((v) => $jsonSerializer.stringify(v)) ?? [];
      const queriesCleaned = params.request.query.map(cleanQuery);
      const payload = zip(queriesCleaned, variablesSerialized).map(([query, variables]) => ({
        query,
        variables
      }));
      searchParams.append(`query`, $jsonSerializer.stringify(payload));
      return searchParams;
    }
    default:
      throw casesExhausted(params.request);
  }
};

// src/legacy/classes/GraphQLClient.ts
var GraphQLClient = class {
  constructor(url, requestConfig = {}) {
    this.url = url;
    this.requestConfig = requestConfig;
  }
  /**
   * Send a GraphQL query to the server.
   */
  rawRequest = async (...args) => {
    const [queryOrOptions, variables, requestHeaders] = args;
    const rawRequestOptions = parseRawRequestArgs(
      queryOrOptions,
      variables,
      requestHeaders
    );
    const {
      headers,
      fetch: fetch2 = globalThis.fetch,
      method = `POST`,
      requestMiddleware,
      responseMiddleware,
      excludeOperationName,
      ...fetchOptions
    } = this.requestConfig;
    const { url } = this;
    if (rawRequestOptions.signal !== void 0) {
      fetchOptions.signal = rawRequestOptions.signal;
    }
    const document = analyzeDocument(
      rawRequestOptions.query,
      excludeOperationName
    );
    const response = await runRequest({
      url,
      request: {
        _tag: `Single`,
        document,
        variables: rawRequestOptions.variables
      },
      headers: {
        ...HeadersInitToPlainObject(callOrIdentity(headers)),
        ...HeadersInitToPlainObject(rawRequestOptions.requestHeaders)
      },
      fetch: fetch2,
      method,
      fetchOptions,
      middleware: requestMiddleware
    });
    if (responseMiddleware) {
      await responseMiddleware(response, {
        operationName: document.operationName,
        variables,
        url: this.url
      });
    }
    if (response instanceof Error) {
      throw response;
    }
    return response;
  };
  async request(documentOrOptions, ...variablesAndRequestHeaders) {
    const [variables, requestHeaders] = variablesAndRequestHeaders;
    const requestOptions = parseRequestArgs(
      documentOrOptions,
      variables,
      requestHeaders
    );
    const {
      headers,
      fetch: fetch2 = globalThis.fetch,
      method = `POST`,
      requestMiddleware,
      responseMiddleware,
      excludeOperationName,
      ...fetchOptions
    } = this.requestConfig;
    const { url } = this;
    if (requestOptions.signal !== void 0) {
      fetchOptions.signal = requestOptions.signal;
    }
    const analyzedDocument = analyzeDocument(
      requestOptions.document,
      excludeOperationName
    );
    const response = await runRequest({
      url,
      request: {
        _tag: `Single`,
        document: analyzedDocument,
        variables: requestOptions.variables
      },
      headers: {
        ...HeadersInitToPlainObject(callOrIdentity(headers)),
        ...HeadersInitToPlainObject(requestOptions.requestHeaders)
      },
      fetch: fetch2,
      method,
      fetchOptions,
      middleware: requestMiddleware
    });
    if (responseMiddleware) {
      await responseMiddleware(response, {
        operationName: analyzedDocument.operationName,
        variables: requestOptions.variables,
        url: this.url
      });
    }
    if (response instanceof Error) {
      throw response;
    }
    return response.data;
  }
  async batchRequests(documentsOrOptions, requestHeaders) {
    const batchRequestOptions = parseBatchRequestArgs(
      documentsOrOptions,
      requestHeaders
    );
    const { headers, excludeOperationName, ...fetchOptions } = this.requestConfig;
    if (batchRequestOptions.signal !== void 0) {
      fetchOptions.signal = batchRequestOptions.signal;
    }
    const analyzedDocuments = batchRequestOptions.documents.map(
      ({ document }) => analyzeDocument(document, excludeOperationName)
    );
    const expressions = analyzedDocuments.map(({ expression }) => expression);
    const hasMutations = analyzedDocuments.some(({ isMutation }) => isMutation);
    const variables = batchRequestOptions.documents.map(
      ({ variables: variables2 }) => variables2
    );
    const response = await runRequest({
      url: this.url,
      request: {
        _tag: `Batch`,
        operationName: void 0,
        query: expressions,
        hasMutations,
        variables
      },
      headers: {
        ...HeadersInitToPlainObject(callOrIdentity(headers)),
        ...HeadersInitToPlainObject(batchRequestOptions.requestHeaders)
      },
      fetch: this.requestConfig.fetch ?? globalThis.fetch,
      method: this.requestConfig.method || `POST`,
      fetchOptions,
      middleware: this.requestConfig.requestMiddleware
    });
    if (this.requestConfig.responseMiddleware) {
      await this.requestConfig.responseMiddleware(response, {
        operationName: void 0,
        variables,
        url: this.url
      });
    }
    if (response instanceof Error) {
      throw response;
    }
    return response.data;
  }
  setHeaders(headers) {
    this.requestConfig.headers = headers;
    return this;
  }
  /**
   * Attach a header to the client. All subsequent requests will have this header.
   */
  setHeader(key, value) {
    const { headers } = this.requestConfig;
    if (headers) {
      headers[key] = value;
    } else {
      this.requestConfig.headers = { [key]: value };
    }
    return this;
  }
  /**
   * Change the client endpoint. All subsequent requests will send to this endpoint.
   */
  setEndpoint(value) {
    this.url = value;
    return this;
  }
};

// src/legacy/functions/request.ts
async function request(urlOrOptions, document, ...variablesAndRequestHeaders) {
  const requestOptions = parseRequestExtendedArgs(urlOrOptions, document, ...variablesAndRequestHeaders);
  const client = new GraphQLClient(requestOptions.url);
  return client.request({
    ...requestOptions
  });
}
var parseRequestArgs = (documentOrOptions, variables, requestHeaders) => {
  return documentOrOptions.document ? documentOrOptions : {
    document: documentOrOptions,
    variables,
    requestHeaders,
    signal: void 0
  };
};
var parseRequestExtendedArgs = (urlOrOptions, document, ...variablesAndRequestHeaders) => {
  const [variables, requestHeaders] = variablesAndRequestHeaders;
  return typeof urlOrOptions === `string` ? {
    url: urlOrOptions,
    document,
    variables,
    requestHeaders,
    signal: void 0
  } : urlOrOptions;
};

// src/legacy/functions/gql.ts
var gql = (chunks, ...variables) => {
  return chunks.reduce(
    (acc, chunk, index) => `${acc}${chunk}${index in variables ? String(variables[index]) : ``}`,
    ``
  );
};

// src/entrypoints/main.ts
var main_default = request;

exports.ClientError = ClientError;
exports.GraphQLClient = GraphQLClient;
exports.analyzeDocument = analyzeDocument;
exports.batchRequests = batchRequests;
exports.default = main_default;
exports.gql = gql;
exports.rawRequest = rawRequest;
exports.request = request;
//# sourceMappingURL=main.cjs.map
//# sourceMappingURL=main.cjs.map