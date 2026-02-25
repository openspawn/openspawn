'use client';

import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { isElement } from '@floating-ui/utils/dom';
import { NOOP } from "../utils/noop.js";
import { useBaseUiId } from "../utils/useBaseUiId.js";
import { useLabelableContext } from "./LabelableContext.js";
export function useLabelableId(params = {}) {
  const {
    id,
    implicit = false,
    controlRef
  } = params;
  const {
    controlId,
    setControlId
  } = useLabelableContext();
  const defaultId = useBaseUiId(id);
  useIsoLayoutEffect(() => {
    if (!implicit && !id || setControlId === NOOP) {
      return undefined;
    }
    if (implicit) {
      const elem = controlRef?.current;
      if (isElement(elem) && elem.closest('label') != null) {
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