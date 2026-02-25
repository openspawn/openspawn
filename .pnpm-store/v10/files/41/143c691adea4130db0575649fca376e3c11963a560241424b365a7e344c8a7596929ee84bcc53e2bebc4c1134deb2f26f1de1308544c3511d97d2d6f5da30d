"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.directive = exports.typeDefs = exports.sdl = void 0;
const graphql_1 = require("graphql");
const helpers_js_1 = require("../graphql/helpers.js");
exports.sdl = `
  directive @inaccessible on FIELD_DEFINITION | OBJECT | INTERFACE | UNION | ENUM | ENUM_VALUE | SCALAR | INPUT_OBJECT | INPUT_FIELD_DEFINITION | ARGUMENT_DEFINITION
`;
exports.typeDefs = (0, graphql_1.parse)(exports.sdl);
exports.directive = exports.typeDefs.definitions.filter(helpers_js_1.isDirectiveDefinition)[0];
