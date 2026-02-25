"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useLabelableId = useLabelableId;
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _dom = require("@floating-ui/utils/dom");
var _noop = require("../utils/noop");
var _useBaseUiId = require("../utils/useBaseUiId");
var _LabelableContext = require("./LabelableContext");
function useLabelableId(params = {}) {
  const {
    id,
    implicit = false,
    controlRef
  } = params;
  const {
    controlId,
    setControlId
  } = (0, _LabelableContext.useLabelableContext)();
  const defaultId = (0, _useBaseUiId.useBaseUiId)(id);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!implicit && !id || setControlId === _noop.NOOP) {
      return undefined;
    }
    if (implicit) {
      const elem = controlRef?.current;
      if ((0, _dom.isElement)(elem) && elem.closest('label') != null) {
        setControlId(id ?? null);
      } else {
        setControlId(controlId ?? defaultId);
      }
    } else if (id) {
      setControlId(id);
    }
    return () => {
      if (id) {
        setControlId(undefined);
      }
    };
  }, [id, controlRef, controlId, setControlId, implicit, defaultId]);
  return controlId ?? defaultId;
}