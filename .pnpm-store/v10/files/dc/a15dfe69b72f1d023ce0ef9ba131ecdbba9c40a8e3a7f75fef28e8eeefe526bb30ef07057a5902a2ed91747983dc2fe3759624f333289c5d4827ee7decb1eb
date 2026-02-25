import { DirectiveDefinitionNode, DirectiveNode, InterfaceTypeDefinitionNode, InterfaceTypeExtensionNode, NamedTypeNode, ObjectTypeDefinitionNode, ObjectTypeExtensionNode, SelectionSetNode, TypeNode } from "graphql";
import { SubgraphValidationContext } from "./validation/validation-context.js";
export declare function validateDirectiveAgainstOriginal(providedDirectiveNode: DirectiveDefinitionNode, directiveName: string, context: SubgraphValidationContext): void;
type ObjectOrInterface = ObjectTypeDefinitionNode | ObjectTypeExtensionNode | InterfaceTypeDefinitionNode | InterfaceTypeExtensionNode;
export declare function visitFields({ context, selectionSet, typeDefinition, interceptField, interceptArguments, interceptUnknownField, interceptDirective, interceptInterfaceType, interceptExternalField, interceptNonExternalField, interceptFieldWithMissingSelectionSet, }: {
    context: SubgraphValidationContext;
    selectionSet: SelectionSetNode;
    typeDefinition: ObjectOrInterface;
    interceptField?(info: {
        typeDefinition: ObjectOrInterface;
        fieldName: string;
    }): void;
    interceptFieldWithMissingSelectionSet?(info: {
        typeDefinition: ObjectOrInterface;
        fieldName: string;
        outputType: string;
    }): void;
    interceptArguments?(info: {
        typeDefinition: ObjectOrInterface;
        fieldName: string;
    }): void;
    interceptUnknownField?(info: {
        typeDefinition: ObjectOrInterface;
        fieldName: string;
    }): void;
    interceptDirective?(info: {
        directiveName: string;
        isKnown: boolean;
    }): void;
    interceptInterfaceType?(info: {
        typeDefinition: ObjectOrInterface;
        fieldName: string;
    }): void;
    interceptExternalField?(info: {
        typeDefinition: ObjectOrInterface;
        fieldName: string;
    }): void;
    interceptNonExternalField?(info: {
        typeDefinition: ObjectOrInterface;
        fieldName: string;
    }): void;
}): void;
export declare function getFieldsArgument(directiveNode: DirectiveNode): import("graphql").ArgumentNode | undefined;
export declare function parseFields(fields: string): SelectionSetNode | undefined;
export declare function namedTypeFromTypeNode(type: TypeNode): NamedTypeNode;
export declare function isDirectiveDefinitionNode(node: any): node is DirectiveDefinitionNode;
export declare function printOutputType(type: TypeNode): string;
export {};
//# sourceMappingURL=helpers.d.ts.map