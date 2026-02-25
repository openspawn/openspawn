"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _nodePath = _interopRequireDefault(require("node:path"));
var _lodash = _interopRequireDefault(require("lodash"));
var _lowdb = _interopRequireDefault(require("lowdb"));
var _FileAsync = _interopRequireDefault(require("lowdb/adapters/FileAsync"));
var _Memory = _interopRequireDefault(require("lowdb/adapters/Memory"));
var _debug = _interopRequireDefault(require("debug"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
const debug = (0, _debug.default)('verdaccio:plugin:local-storage-legacy:token');
const TOKEN_DB_NAME = '.token-db.json';
class TokenActions {
  constructor(config) {
    _defineProperty(this, "config", void 0);
    _defineProperty(this, "tokenDb", void 0);
    this.config = config;
    this.tokenDb = null;
  }
  _dbGenPath(dbName, config) {
    return _nodePath.default.join(_nodePath.default.resolve(_nodePath.default.dirname(config.self_path || ''), config.storage, dbName));
  }
  async getTokenDb() {
    if (!this.tokenDb) {
      debug('token database is not defined');
      let adapter;
      if (process.env.NODE_ENV === 'test') {
        debug('token memory adapter');
        adapter = new _Memory.default('');
      } else {
        debug('token async adapter');
        const pathDb = this._dbGenPath(TOKEN_DB_NAME, this.config);
        adapter = new _FileAsync.default(pathDb);
      }
      debug('token bd generated');
      this.tokenDb = await (0, _lowdb.default)(adapter);
    }
    return this.tokenDb;
  }
  async saveToken(token) {
    debug('token key %o', token.key);
    const db = await this.getTokenDb();
    const userData = await db.get(token.user).value();
    debug('user data %o', userData);
    if (_lodash.default.isNil(userData)) {
      await db.set(token.user, [token]).write();
      debug('token user %o new database', token.user);
    } else {
      // types does not match with valid implementation
      // @ts-ignore
      await db.get(token.user)
      // @ts-ignore
      .push(token).write();
    }
    debug('data %o', await db.getState());
    debug('token saved %o', token.user);
  }
  async deleteToken(user, tokenKey) {
    const db = await this.getTokenDb();
    const userTokens = await db.get(user).value();
    if (_lodash.default.isNil(userTokens)) {
      throw new Error('user not found');
    }
    debug('tokens %o - %o', userTokens, userTokens.length);
    const remainingTokens = userTokens.filter(({
      key
    }) => {
      debug('key %o', key);
      return key !== tokenKey;
    });
    await db.set(user, remainingTokens).write();
    debug('removed tokens key %o', tokenKey);
  }
  async readTokens(filter) {
    const {
      user
    } = filter;
    debug('read tokens with %o', user);
    const db = await this.getTokenDb();
    const tokens = await db.get(user).value();
    return tokens || [];
  }
}
exports.default = TokenActions;
//# sourceMappingURL=token.js.map