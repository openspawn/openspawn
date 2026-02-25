import { ASTNode, DirectiveDefinitionNode, DocumentNode, GraphQLError, InterfaceTypeDefinitionNode, InterfaceTypeExtensionNode, Kind, ObjectTypeDefinitionNode, ObjectTypeExtensionNode, TypeDefinitionNode, TypeExtensionNode } from "graphql";
import { TypeNodeInfo } from "../../graphql/type-node-info.cjs";
import { FederationVersion } from "../../specifications/federation.cjs";
import { LinkImport } from "../../specifications/link.cjs";
import { type SubgraphStateBuilder } from "../state.cjs";
export type SubgraphValidationContext = ReturnType<typeof createSubgraphValidationContext>;
export type SimpleValidationContext = ReturnType<typeof createSimpleValidationContext>;
export declare function createSimpleValidationContext(typeDefs: DocumentNode, typeNodeInfo: TypeNodeInfo): {
    getDocument(): DocumentNode;
    getKnownDirectiveDefinition(name: string): DirectiveDefinitionNode | undefined;
    getKnownTypeDefinition(name: string): Pick<TypeDefinitionNode | TypeExtensionNode, "name" | "kind"> | undefined;
    getSchemaCoordinate(ancestors: readonly (ASTNode | readonly ASTNode[])[]): string;
    reportError(error: GraphQLError): void;
    collectReportedErrors(): GraphQLError[];
};
export declare function createSubgraphValidationContext(subgraph: {
    name: string;
    id: string;
    typeDefs: DocumentNode;
}, federation: {
    version: FederationVersion;
    imports: readonly LinkImport[];
}, typeNodeInfo: TypeNodeInfo, stateBuilder: SubgraphStateBuilder): {
    stateBuilder: {
        isInterfaceObject: (typeName: string) => boolean;
        directive: {
            setComposed(directiveName: string): void;
            setLocation(directiveName: string, location: string): void;
            setRepeatable(directiveName: string): void;
            arg: {
                setTag(directiveName: string, argName: string, tag: string): void;
                setType(directiveName: string, argName: string, argType: string): void;
                setKind(directiveName: string, argName: string, argKind: import("../state.js").ArgumentKind): void;
                setDirective(typeName: string, argName: string, directive: import("graphql").DirectiveNode): void;
                setDefaultValue(typeName: string, argName: string, defaultValue: string): void;
                setInaccessible(typeName: string, argName: string): void;
            };
        };
        scalarType: {
            setDefinition(typeName: string): void;
            setInaccessible(typeName: string): void;
            setAuthenticated(typeName: string): void;
            setPolicies(typeName: string, policies: string[][]): void;
            setScopes(typeName: string, scopes: string[][]): void;
            setCost(typeName: string, cost: number): void;
            setTag(typeName: string, tag: string): void;
            setDirective(typeName: string, directive: import("graphql").DirectiveNode): void;
            setDescription(typeName: string, description: import("../state.js").Description): void;
            setSpecifiedBy(typeName: string, url: string): void;
        };
        objectType: {
            setDefinition(typeName: string): void;
            setExtension(typeName: string, extensionType: "@extends" | "extend"): void;
            setDescription(typeName: string, description: import("../state.js").Description): void;
            setExternal(typeName: string): void;
            setInterface(typeName: string, interfaceName: string): void;
            setKey(typeName: string, fields: string, fieldsUsedInKey: Set<string>, resolvable: boolean): void;
            setInaccessible(typeName: string): void;
            setAuthenticated(typeName: string): void;
            setPolicies(typeName: string, policies: string[][]): void;
            setScopes(typeName: string, scopes: string[][]): void;
            setCost(typeName: string, cost: number): void;
            setShareable(typeName: string): void;
            setTag(typeName: string, tag: string): void;
            setDirective(typeName: string, directive: import("graphql").DirectiveNode): void;
            field: {
                setType(typeName: string, fieldName: string, fieldType: string): void;
                setLeaf(typeName: string, fieldName: string): void;
                setExtension(typeName: string, fieldName: string): void;
                setDirective(typeName: string, fieldName: string, directive: import("graphql").DirectiveNode): void;
                setDescription(typeName: string, fieldName: string, description: import("../state.js").Description): void;
                setDeprecated(typeName: string, fieldName: string, reason?: string): void;
                setAuthenticated(typeName: string, fieldName: string): void;
                setPolicies(typeName: string, fieldName: string, policies: string[][]): void;
                setScopes(typeName: string, fieldName: string, scopes: string[][]): void;
                setCost(typeName: string, fieldName: string, cost: number): void;
                setListSize(typeName: string, fieldName: string, listSize: import("../state.js").ListSize): void;
                setExternal(typeName: string, fieldName: string): void;
                setInaccessible(typeName: string, fieldName: string): void;
                setOverride(typeName: string, fieldName: string, override: string, label: string | null): void;
                setProvides(typeName: string, fieldName: string, provides: string): void;
                setRequires(typeName: string, fieldName: string, requires: string): void;
                markAsProvided(typeName: string, fieldName: string): void;
                markedAsRequired(typeName: string, fieldName: string): void;
                setShareable(typeName: string, fieldName: string): void;
                setTag(typeName: string, fieldName: string, tag: string): void;
                setUsed(typeName: string, fieldName: string): void;
                arg: {
                    setType(typeName: string, fieldName: string, argName: string, argType: string): void;
                    setKind(typeName: string, fieldName: string, argName: string, argKind: import("../state.js").ArgumentKind): void;
                    setDescription(typeName: string, fieldName: string, argName: string, description: import("../state.js").Description): void;
                    setDeprecated(typeName: string, fieldName: string, argName: string, reason?: string): void;
                    setDirective(typeName: string, fieldName: string, argName: string, directive: import("graphql").DirectiveNode): void;
                    setDefaultValue(typeName: string, fieldName: string, argName: string, defaultValue: string): void;
                    setInaccessible(typeName: string, fieldName: string, argName: string): void;
                    setTag(typeName: string, fieldName: string, argName: string, tag: string): void;
                    setCost(typeName: string, fieldName: string, argName: string, cost: number): void;
                };
            };
        };
        interfaceType: {
            setDefinition(typeName: string): void;
            setExtension(typeName: string): void;
            setInterface(typeName: string, interfaceName: string): void;
            setInterfaceObject(typeName: string): void;
            setKey(typeName: string, fields: string, fieldsUsedInKey: Set<string>, resolvable: boolean): void;
            setInaccessible(typeName: string): void;
            setTag(typeName: string, tag: string): void;
            setDirective(typeName: string, directive: import("graphql").DirectiveNode): void;
            setDescription(typeName: string, description: import("../state.js").Description): void;
            field: {
                setType(typeName: string, fieldName: string, fieldType: string): void;
                setLeaf(typeName: string, fieldName: string): void;
                setExternal(typeName: string, fieldName: string): void;
                setInaccessible(typeName: string, fieldName: string): void;
                setAuthenticated(typeName: string, fieldName: string): void;
                setPolicies(typeName: string, fieldName: string, policies: string[][]): void;
                setScopes(typeName: string, fieldName: string, scopes: string[][]): void;
                setCost(typeName: string, fieldName: string, cost: number): void;
                setListSize(typeName: string, fieldName: string, listSize: import("../state.js").ListSize): void;
                setOverride(typeName: string, fieldName: string, override: string, label: string | null): void;
                setRequires(typeName: string, fieldName: string, requires: string): void;
                setShareable(typeName: string, fieldName: string): void;
                setTag(typeName: string, fieldName: string, tag: string): void;
                setUsed(typeName: string, fieldName: string): void;
                setDirective(typeName: string, fieldName: string, directive: import("graphql").DirectiveNode): void;
                setDescription(typeName: string, fieldName: string, description: import("../state.js").Description): void;
                setDeprecated(typeName: string, fieldName: string, reason?: string): void;
                arg: {
                    setType(typeName: string, fieldName: string, argName: string, argType: string): void;
                    setKind(typeName: string, fieldName: string, argName: string, argKind: import("../state.js").ArgumentKind): void;
                    setDefaultValue(typeName: string, fieldName: string, argName: string, defaultValue: string): void;
                    setDeprecated(typeName: string, fieldName: string, argName: string, reason?: string): void;
                    setDescription(typeName: string, fieldName: string, argName: string, description: import("../state.js").Description): void;
                    setTag(typeName: string, fieldName: string, argName: string, tag: string): void;
                    setInaccessible(typeName: string, fieldName: string, argName: string): void;
                    setCost(typeName: string, fieldName: string, argName: string, cost: number): void;
                    setDirective(typeName: string, fieldName: string, argName: string, directive: import("graphql").DirectiveNode): void;
                };
            };
        };
        inputObjectType: {
            setDefinition(typeName: string): void;
            setExtension(typeName: string): void;
            setDescription(typeName: string, description: import("../state.js").Description): void;
            setInaccessible(typeName: string): void;
            setDirective(typeName: string, directive: import("graphql").DirectiveNode): void;
            setTag(typeName: string, tag: string): void;
            field: {
                setType(typeName: string, fieldName: string, fieldType: string): void;
                setKind(typeName: string, fieldName: string, fieldKind: import("../state.js").ArgumentKind): void;
                setDescription(typeName: string, fieldName: string, description: import("../state.js").Description): void;
                setDeprecated(typeName: string, fieldName: string, reason?: string): void;
                setDefaultValue(typeName: string, fieldName: string, defaultValue: string): void;
                setInaccessible(typeName: string, fieldName: string): void;
                setTag(typeName: string, fieldName: string, tag: string): void;
                setDirective(typeName: string, fieldName: string, directive: import("graphql").DirectiveNode): void;
                setCost(typeName: string, fieldName: string, cost: number): void;
            };
        };
        unionType: {
            setDefinition(typeName: string): void;
            setInaccessible(typeName: string): void;
            setTag(typeName: string, tag: string): void;
            setDescription(typeName: string, description: import("../state.js").Description): void;
            setMember(typeName: string, member: string): void;
            setDirective(typeName: string, directive: import("graphql").DirectiveNode): void;
        };
        enumType: {
            setDefinition(typeName: string): void;
            setInaccessible(typeName: string): void;
            setAuthenticated(typeName: string): void;
            setPolicies(typeName: string, policies: string[][]): void;
            setScopes(typeName: string, scopes: string[][]): void;
            setCost(typeName: string, cost: number): void;
            setDescription(typeName: string, description: import("../state.js").Description): void;
            setTag(typeName: string, tag: string): void;
            setReferencedByInputType(typeName: string, schemaCoordinate: string): void;
            setReferencedByOutputType(typeName: string, schemaCoordinate: string): void;
            setDirective(typeName: string, directive: import("graphql").DirectiveNode): void;
            value: {
                setValue(typeName: string, valueName: string): void;
                setDescription(typeName: string, valueName: string, description: import("../state.js").Description): void;
                setDirective(typeName: string, valueName: string, directive: import("graphql").DirectiveNode): void;
                setInaccessible(typeName: string, valueName: string): void;
                setTag(typeName: string, valueName: string, tag: string): void;
                setDeprecated(typeName: string, valueName: string, reason?: string): void;
            };
        };
        composedDirectives: Set<string>;
        state: import("../state.js").SubgraphState;
        markCostSpecAsUsed(directive: keyof import("../state.js").SubgraphState["specs"]["cost"]["names"], name: string): void;
        markSpecAsUsed(specName: Exclude<keyof import("../state.js").SubgraphState["specs"], "cost">): void;
        visitor(typeNodeInfo: TypeNodeInfo): import("graphql").ASTVisitor;
    };
    federationImports: readonly ({
        readonly kind: "type" | "directive";
        readonly name: string;
        readonly alias?: undefined;
    } | {
        readonly kind: "type" | "directive";
        readonly name: string;
        readonly alias: string;
    })[];
    isLinkSpecDirective(name: string): boolean;
    isLinkSpecType(name: string): boolean;
    isAvailableFederationType(name: string): boolean;
    isAvailableFederationDirective(specDirectiveName: string, directiveNode: {
        name: {
            value: string;
        } | string;
    }): boolean;
    satisfiesVersionRange(range: `${"<" | ">=" | ">"} ${FederationVersion}`): boolean;
    getKnownFederationDirectives(): DirectiveDefinitionNode[];
    getAvailableFederationDirectives(): DirectiveDefinitionNode[];
    isLeafType(typeName: string): boolean;
    getSubgraphObjectOrInterfaceTypes(): Map<string, ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | ObjectTypeExtensionNode | InterfaceTypeExtensionNode>;
    getSubgraphUnionTypes(): Map<string, Set<string>>;
    getSubgraphDirectiveDefinitions(): Map<string, DirectiveDefinitionNode>;
    getAvailableFederationTypeAndDirectiveDefinitions(): (DirectiveDefinitionNode | TypeDefinitionNode)[];
    typeNodeInfo: TypeNodeInfo;
    getDocument(): DocumentNode;
    getSubgraphName(): string;
    getSubgraphId(): string;
    markAsExternal(coordinate: string): void;
    getFieldsToMarkAsShareable(): {
        typeName: string;
        fieldName: string;
    }[];
    markAsUsed(reason: "fields" | "@extends" | "references @shareable", kind: Kind.OBJECT_TYPE_DEFINITION | Kind.INTERFACE_TYPE_DEFINITION | Kind.OBJECT_TYPE_EXTENSION | Kind.INTERFACE_TYPE_EXTENSION, typeName: string, fieldName: string): void;
    markAsKeyField(coordinate: string): void;
    markAsFederationDefinitionReplacement(name: string): void;
    collectFederationDefinitionReplacements(): Set<string>;
    collectUnusedExternal(): string[];
    reportError(error: GraphQLError): void;
    collectReportedErrors(): GraphQLError[];
};
//# sourceMappingURL=validation-context.d.ts.map