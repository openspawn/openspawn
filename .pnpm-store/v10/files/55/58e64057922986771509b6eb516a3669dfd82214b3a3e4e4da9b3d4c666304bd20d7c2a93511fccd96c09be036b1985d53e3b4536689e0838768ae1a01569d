"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validatePublishSingleVersion = validatePublishSingleVersion;
var _ajv = _interopRequireDefault(require("ajv"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const ajv = new _ajv.default();

// FIXME: this could extend from @verdaccio/types but we need
// schemas from @verdaccio/types to be able to validate them

const schema = {
  type: 'object',
  properties: {
    name: {
      type: 'string'
    },
    versions: {
      type: 'object',
      maxProperties: 1
    },
    _attachments: {
      type: 'object',
      maxProperties: 1
    }
  },
  required: ['name', 'versions', '_attachments'],
  additionalProperties: true
};

// validate is a type guard for MyData - type is inferred from schema type
const validate = ajv.compile(schema);

/**
 * Validate if a manifest has the correct structure when a new package
 * is being created. The properties name, versions and _attachments must contain 1 element.
 * @param data a manifest object
 * @returns boolean
 */
function validatePublishSingleVersion(manifest) {
  if (!manifest) {
    return false;
  }
  return validate(manifest);
}
//# sourceMappingURL=publish-manifest.js.map