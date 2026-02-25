"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.directive = exports.typeDefs = exports.sdl = void 0;
const graphql_1 = require("graphql");
const helpers_js_1 = require("../graphql/helpers.js");
exports.sdl = `
  directive @tag(
    name: String!
  ) repeatable on FIELD_DEFINITION | OBJECT | INTERFACE | UNION | ARGUMENT_DEFINITION | SCALAR | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION | SCHEMA
`;
exports.typeDefs = (0, graphql_1.parse)(exports.sdl);
exports.directive = exports.typeDefs.definitions.filter(helpers_js_1.isDirectiveDefinition)[0];
