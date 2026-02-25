import { extname } from 'path';
import { concatAST, Kind } from 'graphql';
import { oldVisit } from '@graphql-codegen/plugin-helpers';
import { ReactQueryVisitor } from './visitor.js';
export const plugin = (schema, documents, config) => {
    const allAst = concatAST(documents.map(v => v.document));
    const allFragments = [
        ...allAst.definitions.filter(d => d.kind === Kind.FRAGMENT_DEFINITION).map(fragmentDef => ({
            node: fragmentDef,
            name: fragmentDef.name.value,
            onType: fragmentDef.typeCondition.name.value,
            isExternal: false,
        })),
        ...(config.externalFragments || []),
    ];
    const visitor = new ReactQueryVisitor(schema, allFragments, config, documents);
    const visitorResult = oldVisit(allAst, { leave: visitor });
    if (visitor.hasOperations) {
        return {
            prepend: [...visitor.getImports(), visitor.getFetcherImplementation()],
            content: [
                '',
                visitor.fragments,
                ...visitorResult.definitions.filter(t => typeof t === 'string'),
            ].join('\n'),
        };
    }
    return {
        prepend: [...visitor.getImports()],
        content: [
            '',
            visitor.fragments,
            ...visitorResult.definitions.filter(t => typeof t === 'string'),
        ].join('\n'),
    };
};
export const validate = async (schema, documents, config, outputFile) => {
    if (extname(outputFile) !== '.ts' && extname(outputFile) !== '.tsx') {
        throw new Error(`Plugin "typescript-react-query" requires extension to be ".ts" or ".tsx"!`);
    }
    if (config.reactQueryVersion !== 5 && config.addSuspenseQuery) {
        throw new Error(`Suspense queries are only supported in react-query@5. Please upgrade your react-query version.`);
    }
};
export { ReactQueryVisitor };
