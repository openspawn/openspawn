import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
/**
 * Data structure to keep track of popup trigger elements by their IDs.
 * Uses both a set of Elements and a map of IDs to Elements for efficient lookups.
 */
export class PopupTriggerMap {
  constructor() {
    this.elements = new Set();
    this.idMap = new Map();
  }

  /**
   * Adds a trigger element with the given ID.
   *
   * Note: The provided element is assumed to not be registered under multiple IDs.
   */
  add(id, element) {
    const existingElement = this.idMap.get(id);
    if (existingElement === element) {
      return;
    }
    if (existingElement !== undefined) {
      // We assume that the same element won't be registered under multiple ids.
      // This is safe considering how useTriggerRegistration is implemented.
      this.elements.delete(existingElement);
    }
    this.elements.add(element);
    this.idMap.set(id, element);
    if (process.env.NODE_ENV !== 'production') {
      if (this.elements.size !== this.idMap.size) {
        throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: A trigger element cannot be registered under multiple IDs in PopupTriggerMap.' : _formatErrorMessage(87));
      }
    }
  }

  /**
   * Removes the trigger element with the given ID.
   */
  delete(id) {
    const element = this.idMap.get(id);
    if (element) {
      this.elements.delete(element);
      this.idMap.delete(id);
    }
  }

  /**
   * Whether the given element is registered as a trigger.
   */
  hasElement(element) {
    return this.elements.has(element);
  }

  /**
   * Whether there is a registered trigger element matching the given predicate.
   */
  hasMatchingElement(predicate) {
    for (const element of this.elements) {
      if (predicate(element)) {
        return true;
      }
    }
    return false;
  }
  getById(id) {
    return this.idMap.get(id);
  }
  entries() {
    return this.idMap.entries();
  }
  get size() {
    return this.idMap.size;
  }
}