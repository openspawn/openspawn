import { type ConstDirectiveNode, type DirectiveNode, type DocumentNode } from "graphql";
type TagExtractionStrategy = (directiveNode: DirectiveNode) => string | null;
declare function createTransformTagDirectives(tagDirectiveName: string, inaccessibleDirectiveName: string): (node: {
    directives?: readonly ConstDirectiveNode[];
}, includeInaccessibleDirective?: boolean) => readonly ConstDirectiveNode[];
type SchemaCoordinateToTagsRegistry = Map<string, Set<string>>;
export declare function buildSchemaCoordinateTagRegister(documentNodes: Array<DocumentNode>): SchemaCoordinateToTagsRegistry;
export declare function applyTagFilterToInaccessibleTransformOnSubgraphSchema(documentNode: DocumentNode, tagRegister: SchemaCoordinateToTagsRegistry, filter: SchemaContractFilter): {
    typeDefs: DocumentNode;
    typesWithAllFieldsInaccessible: Map<string, boolean>;
    transformTagDirectives: ReturnType<typeof createTransformTagDirectives>;
    typesWithInaccessibleApplied: Set<string>;
};
export declare function applyTagFilterOnSubgraphs<TType extends {
    typeDefs: DocumentNode;
}>(subgraphs: Array<TType>, filter: SchemaContractFilter): Array<TType>;
export declare function createTagDirectiveNameExtractionStrategy(directiveName: string): TagExtractionStrategy;
export type SchemaContractFilter = {
    include: Set<string>;
    exclude: Set<string>;
};
export {};
//# sourceMappingURL=tag-extraction.d.ts.map