import { GraphQLError, Kind } from "graphql";
import { print } from "../../../../graphql/printer.js";
import { validateDirectiveAgainstOriginal } from "../../../helpers.js";
export function ExternalRules(context) {
    return {
        DirectiveDefinition(node) {
            validateDirectiveAgainstOriginal(node, "external", context);
        },
        Directive(node) {
            if (!context.isAvailableFederationDirective("external", node)) {
                return;
            }
            const typeDef = context.typeNodeInfo.getTypeDef();
            const fieldDef = context.typeNodeInfo.getFieldDef();
            if (!typeDef ||
                !(typeDef.kind === Kind.OBJECT_TYPE_DEFINITION ||
                    typeDef.kind === Kind.OBJECT_TYPE_EXTENSION)) {
                return;
            }
            const fieldDefinitions = [];
            if (fieldDef) {
                if (fieldDef.kind !== Kind.FIELD_DEFINITION) {
                    return;
                }
                fieldDefinitions.push(fieldDef);
            }
            else {
                const fields = typeDef.fields;
                if (fields) {
                    if (context.satisfiesVersionRange(">= v2.0")) {
                        fieldDefinitions.push(...fields);
                    }
                }
            }
            for (const field of fieldDefinitions) {
                context.markAsExternal(`${typeDef.name.value}.${field.name.value}`);
                const conflictingDirectives = field.directives?.filter((directive) => context.isAvailableFederationDirective("tag", directive) ||
                    context.isAvailableFederationDirective("inaccessible", directive));
                if (conflictingDirectives?.length &&
                    context.satisfiesVersionRange(">= v2.0")) {
                    for (const directive of conflictingDirectives) {
                        context.reportError(new GraphQLError(`Cannot apply merged directive ${print(directive).trim()} to external field "${typeDef.name.value}.${field.name.value}"`, {
                            nodes: node,
                            extensions: {
                                code: "MERGED_DIRECTIVE_APPLICATION_ON_EXTERNAL",
                            },
                        }));
                    }
                }
                else {
                    context.stateBuilder.objectType.field.setExternal(typeDef.name.value, field.name.value);
                }
            }
        },
    };
}
