"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.USER_API_ENDPOINTS = exports.TOKEN_API_ENDPOINTS = exports.STARS_API_ENDPOINTS = exports.SEARCH_API_ENDPOINTS = exports.PUBLISH_API_ENDPOINTS = exports.PROFILE_API_ENDPOINTS = exports.PING_API_ENDPOINTS = exports.PACKAGE_API_ENDPOINTS = exports.LOGIN_API_ENDPOINTS = exports.DIST_TAGS_API_ENDPOINTS = void 0;
let USER_API_ENDPOINTS = exports.USER_API_ENDPOINTS = /*#__PURE__*/function (USER_API_ENDPOINTS) {
  USER_API_ENDPOINTS["whoami"] = "/-/whoami";
  USER_API_ENDPOINTS["get_user"] = "/-/user/:org_couchdb_user";
  USER_API_ENDPOINTS["add_user"] = "/-/user/:org_couchdb_user/:_rev?/:revision?";
  USER_API_ENDPOINTS["user_token"] = "/-/user/token/*";
  return USER_API_ENDPOINTS;
}({});
let STARS_API_ENDPOINTS = exports.STARS_API_ENDPOINTS = /*#__PURE__*/function (STARS_API_ENDPOINTS) {
  STARS_API_ENDPOINTS["get_user_starred_packages"] = "/-/_view/starredByUser";
  return STARS_API_ENDPOINTS;
}({});
let SEARCH_API_ENDPOINTS = exports.SEARCH_API_ENDPOINTS = /*#__PURE__*/function (SEARCH_API_ENDPOINTS) {
  SEARCH_API_ENDPOINTS["search"] = "/-/v1/search";
  SEARCH_API_ENDPOINTS["deprecated_search"] = "/-/all(/since)?";
  return SEARCH_API_ENDPOINTS;
}({});
let PUBLISH_API_ENDPOINTS = exports.PUBLISH_API_ENDPOINTS = /*#__PURE__*/function (PUBLISH_API_ENDPOINTS) {
  PUBLISH_API_ENDPOINTS["add_package"] = "/:package";
  PUBLISH_API_ENDPOINTS["publish_package"] = "/:package/-rev/:revision";
  PUBLISH_API_ENDPOINTS["remove_tarball"] = "/:package/-/:filename/-rev/:revision";
  return PUBLISH_API_ENDPOINTS;
}({});
let PING_API_ENDPOINTS = exports.PING_API_ENDPOINTS = /*#__PURE__*/function (PING_API_ENDPOINTS) {
  PING_API_ENDPOINTS["ping"] = "/-/ping";
  return PING_API_ENDPOINTS;
}({});
let PACKAGE_API_ENDPOINTS = exports.PACKAGE_API_ENDPOINTS = /*#__PURE__*/function (PACKAGE_API_ENDPOINTS) {
  PACKAGE_API_ENDPOINTS["get_package_by_version"] = "/:package/:version?";
  PACKAGE_API_ENDPOINTS["get_package_tarball"] = "/:package/-/:filename";
  return PACKAGE_API_ENDPOINTS;
}({});
let DIST_TAGS_API_ENDPOINTS = exports.DIST_TAGS_API_ENDPOINTS = /*#__PURE__*/function (DIST_TAGS_API_ENDPOINTS) {
  DIST_TAGS_API_ENDPOINTS["tagging"] = "/:package/:tag";
  DIST_TAGS_API_ENDPOINTS["tagging_package"] = "/-/package/:package/dist-tags/:tag";
  DIST_TAGS_API_ENDPOINTS["get_dist_tags"] = "/-/package/:package/dist-tags";
  return DIST_TAGS_API_ENDPOINTS;
}({});
let PROFILE_API_ENDPOINTS = exports.PROFILE_API_ENDPOINTS = /*#__PURE__*/function (PROFILE_API_ENDPOINTS) {
  PROFILE_API_ENDPOINTS["get_profile"] = "/-/npm/v1/user";
  return PROFILE_API_ENDPOINTS;
}({});
let TOKEN_API_ENDPOINTS = exports.TOKEN_API_ENDPOINTS = /*#__PURE__*/function (TOKEN_API_ENDPOINTS) {
  TOKEN_API_ENDPOINTS["get_tokens"] = "/-/npm/v1/tokens";
  TOKEN_API_ENDPOINTS["delete_token"] = "/-/npm/v1/tokens/token/:tokenKey";
  return TOKEN_API_ENDPOINTS;
}({});
let LOGIN_API_ENDPOINTS = exports.LOGIN_API_ENDPOINTS = /*#__PURE__*/function (LOGIN_API_ENDPOINTS) {
  LOGIN_API_ENDPOINTS["login"] = "/-/v1/login";
  LOGIN_API_ENDPOINTS["login_cli"] = "/-/v1/login_cli";
  LOGIN_API_ENDPOINTS["login_cli_session"] = "/-/v1/login_cli/:sessionId";
  LOGIN_API_ENDPOINTS["login_done"] = "/-/v1/done";
  LOGIN_API_ENDPOINTS["login_done_session"] = "/-/v1/done/:sessionId";
  return LOGIN_API_ENDPOINTS;
}({});
//# sourceMappingURL=api_urls.js.map