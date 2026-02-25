"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Info = Info;
require("reflect-metadata");
const gql_paramtype_enum_1 = require("../enums/gql-paramtype.enum");
const param_utils_1 = require("./param.utils");
/**
 * Resolver method parameter decorator. Extracts the `Info`
 * object from the underlying platform and populates the decorated
 * parameter with the value of `Info`.
 *
 * @publicApi
 */
function Info(...pipes) {
    return (0, param_utils_1.createGqlPipesParamDecorator)(gql_paramtype_enum_1.GqlParamtype.INFO)(undefined, ...pipes);
}
