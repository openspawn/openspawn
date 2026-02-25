"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.calculateLevel = calculateLevel;
exports.subSystemLevels = exports.levelsColors = void 0;
var _colorette = require("colorette");
function calculateLevel(levelCode) {
  switch (true) {
    case levelCode === 10:
      return 'trace';
    case levelCode === 20:
      return 'debug';
    case levelCode === 25:
      return 'http';
    case levelCode === 30:
      return 'info';
    case levelCode === 40:
      return 'warn';
    case levelCode === 50:
      return 'error';
    case levelCode === 60:
      return 'fatal';
    default:
      return 'fatal';
  }
}
const levelsColors = exports.levelsColors = {
  fatal: _colorette.red,
  error: _colorette.red,
  warn: _colorette.yellow,
  http: _colorette.magenta,
  info: _colorette.cyan,
  debug: _colorette.green,
  trace: _colorette.white
};
var ARROWS = /*#__PURE__*/function (ARROWS) {
  ARROWS["LEFT"] = "<--";
  ARROWS["RIGHT"] = "-->";
  ARROWS["EQUAL"] = "-=-";
  ARROWS["NEUTRAL"] = "---";
  return ARROWS;
}(ARROWS || {});
const subSystemLevels = exports.subSystemLevels = {
  color: {
    in: (0, _colorette.green)(ARROWS.LEFT),
    out: (0, _colorette.yellow)(ARROWS.RIGHT),
    auth: (0, _colorette.blue)(ARROWS.NEUTRAL),
    fs: (0, _colorette.black)(ARROWS.EQUAL),
    default: (0, _colorette.blue)(ARROWS.NEUTRAL)
  },
  white: {
    in: ARROWS.LEFT,
    out: ARROWS.RIGHT,
    auth: ARROWS.NEUTRAL,
    fs: ARROWS.EQUAL,
    default: ARROWS.NEUTRAL
  }
};
//# sourceMappingURL=levels.js.map