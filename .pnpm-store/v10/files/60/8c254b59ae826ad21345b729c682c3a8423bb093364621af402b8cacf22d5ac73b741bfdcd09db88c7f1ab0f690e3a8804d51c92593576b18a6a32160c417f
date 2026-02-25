/**
 * Data structure to keep track of popup trigger elements by their IDs.
 * Uses both a set of Elements and a map of IDs to Elements for efficient lookups.
 */
export declare class PopupTriggerMap {
  private elements;
  private idMap;
  constructor();
  /**
   * Adds a trigger element with the given ID.
   *
   * Note: The provided element is assumed to not be registered under multiple IDs.
   */
  add(id: string, element: Element): void;
  /**
   * Removes the trigger element with the given ID.
   */
  delete(id: string): void;
  /**
   * Whether the given element is registered as a trigger.
   */
  hasElement(element: Element): boolean;
  /**
   * Whether there is a registered trigger element matching the given predicate.
   */
  hasMatchingElement(predicate: (el: Element) => boolean): boolean;
  getById(id: string): Element | undefined;
  entries(): IterableIterator<[string, Element]>;
  get size(): number;
}