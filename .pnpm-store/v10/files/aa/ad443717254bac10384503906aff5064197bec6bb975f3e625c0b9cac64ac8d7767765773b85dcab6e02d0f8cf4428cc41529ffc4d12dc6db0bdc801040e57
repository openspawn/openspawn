"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sdl = void 0;
const version_js_1 = require("../utils/version.js");
const sdl = (version) => {
    const joinField = `
      directive @join__field(
        graph: join__Graph
        requires: join__FieldSet
        provides: join__FieldSet
        type: String
        external: Boolean
        override: String
        usedOverridden: Boolean
        ${(0, version_js_1.satisfiesVersionRange)(version, ">= v2.7") ? "overrideLabel: String" : ""}
        ${(0, version_js_1.satisfiesVersionRange)(version, ">= v2.8") ? "contextArguments: [join__ContextArgument!]" : ""}
      ) repeatable on FIELD_DEFINITION | INPUT_FIELD_DEFINITION
    `;
    const joinContextArgument = (0, version_js_1.satisfiesVersionRange)(version, ">= v2.8")
        ? `
        input join__ContextArgument {
          name: String!
          type: String!
          context: String!
          selection: join__FieldValue!
        }
      `
        : "";
    const joinFieldValue = (0, version_js_1.satisfiesVersionRange)(version, ">= v2.8")
        ? `
        scalar join__FieldValue
      `
        : "";
    return `
    directive @join__enumValue(graph: join__Graph!) repeatable on ENUM_VALUE

    directive @join__graph(name: String!, url: String!) on ENUM_VALUE

    ${joinField}
    ${joinContextArgument}

    directive @join__implements(
      graph: join__Graph!
      interface: String!
    ) repeatable on OBJECT | INTERFACE

    directive @join__type(
      graph: join__Graph!
      key: join__FieldSet
      extension: Boolean! = false
      resolvable: Boolean! = true
      isInterfaceObject: Boolean! = false
    ) repeatable on OBJECT | INTERFACE | UNION | ENUM | INPUT_OBJECT | SCALAR

    directive @join__unionMember(
      graph: join__Graph!
      member: String!
    ) repeatable on UNION

    scalar join__FieldSet
    ${joinFieldValue}
  `;
};
exports.sdl = sdl;
