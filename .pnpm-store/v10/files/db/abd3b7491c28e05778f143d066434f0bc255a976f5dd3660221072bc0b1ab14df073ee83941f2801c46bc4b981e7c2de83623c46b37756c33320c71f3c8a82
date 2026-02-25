"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertUniqueSubgraphNames = assertUniqueSubgraphNames;
exports.validateSubgraphCore = validateSubgraphCore;
exports.validateSubgraph = validateSubgraph;
const graphql_1 = require("graphql");
const type_node_info_js_1 = require("../../graphql/type-node-info.js");
const federation_js_1 = require("../../specifications/federation.js");
const link_js_1 = require("../../specifications/link.js");
const authenticated_js_1 = require("./rules/elements/authenticated.js");
const compose_directive_js_1 = require("./rules/elements/compose-directive.js");
const context_js_1 = require("./rules/elements/context.js");
const cost_js_1 = require("./rules/elements/cost.js");
const extends_js_1 = require("./rules/elements/extends.js");
const external_js_1 = require("./rules/elements/external.js");
const field_set_js_1 = require("./rules/elements/field-set.js");
const from_context_js_1 = require("./rules/elements/from-context.js");
const inaccessible_js_1 = require("./rules/elements/inaccessible.js");
const interface_object_js_1 = require("./rules/elements/interface-object.js");
const key_js_1 = require("./rules/elements/key.js");
const list_size_js_1 = require("./rules/elements/list-size.js");
const override_js_1 = require("./rules/elements/override.js");
const policy_js_1 = require("./rules/elements/policy.js");
const provides_js_1 = require("./rules/elements/provides.js");
const requires_scopes_js_1 = require("./rules/elements/requires-scopes.js");
const requires_js_1 = require("./rules/elements/requires.js");
const shareable_js_1 = require("./rules/elements/shareable.js");
const tag_js_1 = require("./rules/elements/tag.js");
const known_argument_names_on_directives_rule_js_1 = require("./rules/known-argument-names-on-directives-rule.js");
const known_directives_rule_js_1 = require("./rules/known-directives-rule.js");
const known_federation_directive_rule_js_1 = require("./rules/known-federation-directive-rule.js");
const known_root_type_rule_js_1 = require("./rules/known-root-type-rule.js");
const known_type_names_rule_js_1 = require("./rules/known-type-names-rule.js");
const lone_schema_definition_rule_js_1 = require("./rules/lone-schema-definition-rule.js");
const only_interface_implementation_rule_js_1 = require("./rules/only-interface-implementation-rule.js");
const provided_arguments_on_directives_rule_js_1 = require("./rules/provided-arguments-on-directives-rule.js");
const provided_required_arguments_on_directives_rule_js_1 = require("./rules/provided-required-arguments-on-directives-rule.js");
const query_root_type_inaccessible_rule_js_1 = require("./rules/query-root-type-inaccessible-rule.js");
const reserved_subgraph_name_rule_js_1 = require("./rules/reserved-subgraph-name-rule.js");
const root_type_used_rule_js_1 = require("./rules/root-type-used-rule.js");
const unique_argument_definition_names_rule_js_1 = require("./rules/unique-argument-definition-names-rule.js");
const unique_argument_names_rule_js_1 = require("./rules/unique-argument-names-rule.js");
const unique_directive_names_rule_js_1 = require("./rules/unique-directive-names-rule.js");
const unique_directives_per_location_rule_js_1 = require("./rules/unique-directives-per-location-rule.js");
const unique_enum_value_names_rule_js_1 = require("./rules/unique-enum-value-names-rule.js");
const unique_field_definition_names_rule_js_1 = require("./rules/unique-field-definition-names-rule.js");
const unique_input_field_names_rule_js_1 = require("./rules/unique-input-field-names-rule.js");
const unique_operation_types_rule_js_1 = require("./rules/unique-operation-types-rule.js");
const unique_type_names_rule_js_1 = require("./rules/unique-type-names-rule.js");
const validate_state_js_1 = require("./validate-state.js");
const validation_context_js_1 = require("./validation-context.js");
function assertUniqueSubgraphNames(subgraphs) {
    const names = new Set();
    for (const subgraph of subgraphs) {
        if (names.has(subgraph.name)) {
            throw new Error(`A subgraph named ${subgraph.name} already exists`);
        }
        names.add(subgraph.name);
    }
}
function validateSubgraphCore(subgraph) {
    const extractedLinks = extractLinks(subgraph);
    if (extractedLinks.errors) {
        extractedLinks.errors.forEach((error) => enrichErrorWithSubgraphName(error, subgraph.name));
    }
    return extractedLinks;
}
function validateSubgraph(subgraph, stateBuilder, federation, __internal) {
    subgraph.typeDefs = cleanSubgraphTypeDefsFromSubgraphSpec(subgraph.typeDefs);
    const linkSpecDefinitions = (0, graphql_1.parse)(`
    enum Purpose {
      EXECUTION
      SECURITY
    }

    directive @link(
      url: String
      as: String
      for: link__Purpose
      import: [link__Import]
    ) repeatable on SCHEMA

    scalar link__Import

    enum link__Purpose {
      """
      \`SECURITY\` features provide metadata necessary to securely resolve fields.
      """
      SECURITY

      """
      \`EXECUTION\` features provide metadata necessary for operation execution.
      """
      EXECUTION
    }
  `).definitions;
    const rulesToSkip = __internal?.disableValidationRules ?? [];
    const typeNodeInfo = new type_node_info_js_1.TypeNodeInfo();
    const validationContext = (0, validation_context_js_1.createSubgraphValidationContext)(subgraph, federation, typeNodeInfo, stateBuilder);
    const federationRules = [
        reserved_subgraph_name_rule_js_1.ReservedSubgraphNameRule,
        known_federation_directive_rule_js_1.KnownFederationDirectivesRule,
        field_set_js_1.FieldSetRules,
        inaccessible_js_1.InaccessibleRules,
        interface_object_js_1.InterfaceObjectRules,
        authenticated_js_1.AuthenticatedRule,
        policy_js_1.PolicyRule,
        requires_scopes_js_1.RequiresScopesRule,
        cost_js_1.CostRule,
        list_size_js_1.ListSizeRule,
        override_js_1.OverrideRules,
        context_js_1.ContextDirectiveRules,
        from_context_js_1.FromContextDirectiveRules,
        extends_js_1.ExtendsRules,
        query_root_type_inaccessible_rule_js_1.QueryRootTypeInaccessibleRule,
        known_type_names_rule_js_1.KnownTypeNamesRule,
        known_root_type_rule_js_1.KnownRootTypeRule,
        root_type_used_rule_js_1.RootTypeUsedRule,
        shareable_js_1.ShareableRules,
        key_js_1.KeyRules,
        provides_js_1.ProvidesRules,
        requires_js_1.RequiresRules,
        external_js_1.ExternalRules,
        tag_js_1.TagRules,
        compose_directive_js_1.ComposeDirectiveRules,
    ];
    const graphqlRules = [
        only_interface_implementation_rule_js_1.OnlyInterfaceImplementationRule,
        lone_schema_definition_rule_js_1.LoneSchemaDefinitionRule,
        unique_operation_types_rule_js_1.UniqueOperationTypesRule,
        unique_type_names_rule_js_1.UniqueTypeNamesRule,
        unique_enum_value_names_rule_js_1.UniqueEnumValueNamesRule,
        unique_field_definition_names_rule_js_1.UniqueFieldDefinitionNamesRule,
        unique_argument_definition_names_rule_js_1.UniqueArgumentDefinitionNamesRule,
        known_directives_rule_js_1.KnownDirectivesRule,
        unique_directives_per_location_rule_js_1.UniqueDirectivesPerLocationRule,
        known_argument_names_on_directives_rule_js_1.KnownArgumentNamesOnDirectivesRule,
        unique_argument_names_rule_js_1.UniqueArgumentNamesRule,
        unique_input_field_names_rule_js_1.UniqueInputFieldNamesRule,
        unique_directive_names_rule_js_1.UniqueDirectiveNamesRule,
        provided_required_arguments_on_directives_rule_js_1.ProvidedRequiredArgumentsOnDirectivesRule,
        provided_arguments_on_directives_rule_js_1.ProvidedArgumentsOnDirectivesRule,
    ];
    (0, graphql_1.visit)(subgraph.typeDefs, (0, type_node_info_js_1.visitWithTypeNodeInfo)(typeNodeInfo, (0, graphql_1.visitInParallel)([stateBuilder.visitor(typeNodeInfo)].concat(federationRules.map((rule) => {
        if (rulesToSkip.includes(rule.name)) {
            return {};
        }
        return rule(validationContext);
    })))));
    const federationDefinitionReplacements = validationContext.collectFederationDefinitionReplacements();
    const linkSpecDefinitionsToInclude = linkSpecDefinitions.filter((def) => {
        if ("name" in def && typeof def.name?.value === "string") {
            return !stateBuilder.state.types.has(def.name.value);
        }
        return true;
    });
    const fullTypeDefs = (0, graphql_1.concatAST)([
        {
            kind: graphql_1.Kind.DOCUMENT,
            definitions: validationContext
                .getAvailableFederationTypeAndDirectiveDefinitions()
                .filter((def) => !federationDefinitionReplacements.has(def.name.value)),
        },
        validationContext.satisfiesVersionRange("> v1.0") &&
            !stateBuilder.state.specs.link
            ?
                linkSpecDefinitionsToInclude.length > 0
                    ? {
                        kind: graphql_1.Kind.DOCUMENT,
                        definitions: linkSpecDefinitionsToInclude,
                    }
                    : null
            : null,
        subgraph.typeDefs,
    ].filter(onlyDocumentNode));
    const subgraphStateErrors = (0, validate_state_js_1.validateSubgraphState)(stateBuilder.state, validationContext);
    const simpleValidationContext = (0, validation_context_js_1.createSimpleValidationContext)(fullTypeDefs, typeNodeInfo);
    (0, graphql_1.visit)(fullTypeDefs, (0, graphql_1.visitInParallel)(graphqlRules.map((rule) => {
        if (rulesToSkip.includes(rule.name)) {
            return {};
        }
        return rule(simpleValidationContext);
    })));
    for (const { typeName, fieldName, } of validationContext.getFieldsToMarkAsShareable()) {
        if (validationContext.stateBuilder.isInterfaceObject(typeName)) {
            continue;
        }
        validationContext.stateBuilder.objectType.field.setShareable(typeName, fieldName);
    }
    return validationContext
        .collectReportedErrors()
        .concat(validationContext.collectUnusedExternal().map((coordinate) => enrichErrorWithSubgraphName(new graphql_1.GraphQLError(`Field "${coordinate}" is marked @external but is not used in any federation directive (@key, @provides, @requires) or to satisfy an interface; the field declaration has no use and should be removed (or the field should not be @external).`, {
        extensions: {
            code: "EXTERNAL_UNUSED",
        },
    }), subgraph.name)))
        .concat(simpleValidationContext.collectReportedErrors())
        .concat(subgraphStateErrors)
        .map((error) => enrichErrorWithSubgraphName(error, subgraph.name));
}
function enrichErrorWithSubgraphName(error, subgraphName) {
    if (error.extensions.subgraphName) {
        return error;
    }
    error.message = `[${subgraphName}] ${error.message}`;
    error.extensions.subgraphName = subgraphName;
    return error;
}
const availableFeatures = {
    link: ["v1.0"],
    tag: ["v0.1", "v0.2"],
    kotlin_labs: ["v0.1", "v0.2"],
    join: ["v0.1", "v0.2", "v0.3", "v0.4", "v0.5"],
    inaccessible: ["v0.1", "v0.2"],
    core: ["v0.1", "v0.2"],
};
function extractLinks(subgraph) {
    const schemaNodes = subgraph.typeDefs.definitions.filter(isSchemaDefinitionOrExtensionNode);
    if (schemaNodes.length === 0) {
        return {
            links: [],
        };
    }
    const linkDirectives = [];
    for (const schemaNode of schemaNodes) {
        if (schemaNode.directives?.length) {
            for (const directiveNode of schemaNode.directives) {
                if (directiveNode.name.value === "link") {
                    linkDirectives.push(directiveNode);
                }
            }
        }
    }
    if (!linkDirectives) {
        return {
            links: [],
        };
    }
    const errors = [];
    const links = [];
    const identities = new Set();
    const reportedAsDuplicate = new Set();
    for (let i = 0; i < linkDirectives.length; i++) {
        const linkDirective = linkDirectives[i];
        try {
            const link = (0, link_js_1.parseLinkDirective)(linkDirective);
            if (!link) {
                continue;
            }
            if (identities.has(link.identity) &&
                !reportedAsDuplicate.has(link.identity)) {
                errors.push(new graphql_1.GraphQLError(`Duplicate inclusion of feature ${link.identity}`, {
                    extensions: {
                        code: "INVALID_LINK_DIRECTIVE_USAGE",
                    },
                }));
                reportedAsDuplicate.add(link.identity);
            }
            identities.add(link.identity);
            if (link.version && !/^v\d+\.\d+/.test(link.version)) {
                errors.push(new graphql_1.GraphQLError(`Expected a version string (of the form v1.2), got ${link.version}`, {
                    extensions: {
                        code: "INVALID_LINK_IDENTIFIER",
                    },
                }));
                continue;
            }
            if (!link.name) {
                errors.push(new graphql_1.GraphQLError(`Missing path in feature url '${link.identity}'`, {
                    extensions: {
                        code: "INVALID_LINK_IDENTIFIER",
                    },
                }));
                continue;
            }
            if (link.identity.startsWith("https://specs.apollo.dev/")) {
                if (link.name === "federation") {
                    if (!link.version) {
                        errors.push(new graphql_1.GraphQLError(`Missing version in feature url '${link.identity}'`, {
                            extensions: {
                                code: "TODO",
                            },
                        }));
                        continue;
                    }
                    const spec = (0, federation_js_1.createSpecSchema)(link.version);
                    const availableElements = new Set(spec.directives
                        .map((d) => d.name.value)
                        .concat(spec.types.map((t) => t.name.value)));
                    let pushedError = false;
                    for (const im of link.imports) {
                        if (!availableElements.has(im.name.replace(/^@/, ""))) {
                            pushedError = true;
                            errors.push(new graphql_1.GraphQLError(`Cannot import unknown element "${im.name}".`, {
                                extensions: {
                                    code: "INVALID_LINK_DIRECTIVE_USAGE",
                                },
                            }));
                        }
                    }
                    if (pushedError) {
                        continue;
                    }
                }
                else if (link.version && availableFeatures[link.name]) {
                    if (!availableFeatures[link.name].includes(link.version)) {
                        errors.push(new graphql_1.GraphQLError(`Schema uses unknown version ${link.version} of the ${link.name} spec`, {
                            extensions: {
                                code: "UNKNOWN_LINK_VERSION",
                            },
                        }));
                        continue;
                    }
                }
            }
            links.push(link);
        }
        catch (error) {
            errors.push(error instanceof graphql_1.GraphQLError ? error : new graphql_1.GraphQLError(String(error)));
        }
    }
    if (errors.length > 0) {
        return {
            errors,
        };
    }
    return {
        links,
    };
}
function isSchemaDefinitionOrExtensionNode(node) {
    return (node.kind === graphql_1.Kind.SCHEMA_DEFINITION ||
        node.kind === graphql_1.Kind.SCHEMA_EXTENSION);
}
function onlyDocumentNode(item) {
    return item != null;
}
function cleanSubgraphTypeDefsFromSubgraphSpec(typeDefs) {
    let queryTypes = [];
    const schemaDef = typeDefs.definitions.find((node) => (node.kind === graphql_1.Kind.SCHEMA_DEFINITION ||
        node.kind === graphql_1.Kind.SCHEMA_EXTENSION) &&
        node.operationTypes?.some((op) => op.operation === graphql_1.OperationTypeNode.QUERY));
    const queryTypeName = schemaDef?.operationTypes?.find((op) => op.operation === graphql_1.OperationTypeNode.QUERY)?.type.name.value ?? "Query";
    typeDefs.definitions =
        typeDefs.definitions.filter((def) => {
            if ((def.kind === graphql_1.Kind.SCALAR_TYPE_DEFINITION ||
                def.kind === graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION) &&
                def.name.value === "_Any") {
                return false;
            }
            if (def.kind === graphql_1.Kind.UNION_TYPE_DEFINITION &&
                def.name.value === "_Entity") {
                return false;
            }
            if (def.kind === graphql_1.Kind.OBJECT_TYPE_DEFINITION &&
                def.name.value === "_Service") {
                return false;
            }
            if ((def.kind === graphql_1.Kind.OBJECT_TYPE_DEFINITION ||
                def.kind === graphql_1.Kind.OBJECT_TYPE_EXTENSION) &&
                def.name.value === queryTypeName) {
                queryTypes.push(def);
            }
            return true;
        });
    if (queryTypes.length > 0) {
        for (const queryType of queryTypes) {
            queryType.fields =
                queryType.fields?.filter((field) => {
                    if (field.name.value === "_service" ||
                        field.name.value === "_entities") {
                        return false;
                    }
                    return true;
                }) ?? [];
        }
    }
    return typeDefs;
}
