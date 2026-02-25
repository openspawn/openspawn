"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fillInMsgTemplate = fillInMsgTemplate;
exports.printMessage = printMessage;
var _colorette = require("colorette");
var _nodeUtil = require("node:util");
var _levels = require("./levels");
var _utils = require("./utils");
let LEVEL_VALUE_MAX = 0;
for (const l in _levels.levelsColors) {
  LEVEL_VALUE_MAX = Math.max(LEVEL_VALUE_MAX, l.length);
}
const ERROR_FLAG = '!';
function fillInMsgTemplate(msg, templateOptions, colors) {
  const templateRegex = /@{(!?[$A-Za-z_][$0-9A-Za-z\._]*)}/g;
  return msg.replace(templateRegex, (_, name) => {
    let str = templateOptions;
    let isError;
    if (name[0] === ERROR_FLAG) {
      name = name.slice(1);
      isError = true;
    }

    // object can be @{foo.bar.}
    const listAccessors = name.split('.');
    for (let property = 0; property < listAccessors.length; property++) {
      const id = listAccessors[property];
      if ((0, _utils.isObject)(str)) {
        str = str[id];
      }
    }
    if (typeof str === 'string') {
      if (colors === false || str.includes('\n')) {
        return str;
      } else if (isError) {
        return (0, _colorette.red)(str);
      }
      return (0, _colorette.green)(str);
    }

    // object, showHidden, depth, colors
    return (0, _nodeUtil.inspect)(str, undefined, null, colors);
  });
}
function getMessage(debugLevel, msg, sub, templateObjects, hasColors) {
  const finalMessage = fillInMsgTemplate(msg, templateObjects, hasColors);
  const subSystemType = hasColors ? _levels.subSystemLevels.color[sub !== null && sub !== void 0 ? sub : 'default'] : _levels.subSystemLevels.white[sub !== null && sub !== void 0 ? sub : 'default'];
  if (hasColors) {
    const logString = `${_levels.levelsColors[debugLevel]((0, _utils.padRight)(debugLevel, LEVEL_VALUE_MAX))}${(0, _colorette.white)(`${subSystemType} ${finalMessage}`)}`;
    return logString;
  }
  const logString = `${(0, _utils.padRight)(debugLevel, LEVEL_VALUE_MAX)}${subSystemType} ${finalMessage}`;
  return logString;
}
function printMessage(templateObjects, options, hasColors) {
  const {
    prettyStamp
  } = options;
  const {
    level,
    msg,
    sub
  } = templateObjects;
  const debugLevel = (0, _levels.calculateLevel)(level);
  const logMessage = getMessage(debugLevel, msg, sub, templateObjects, hasColors);
  return prettyStamp ? (0, _utils.formatLoggingDate)(templateObjects.time, logMessage) : logMessage;
}
//# sourceMappingURL=formatter.js.map