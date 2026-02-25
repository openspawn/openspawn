import { Store } from "./Store.js";
/**
 * A Store that supports controlled state keys, non-reactive values and provides utility methods for React.
 */
export declare class ReactStore<State extends object, Context = Record<string, never>, Selectors extends Record<string, SelectorFunction<State>> = Record<string, never>> extends Store<State> {
  /**
   * Creates a new ReactStore instance.
   *
   * @param state Initial state of the store.
   * @param context Non-reactive context values.
   * @param selectors Optional selectors for use with `useState`.
   */
  constructor(state: State, context?: Context, selectors?: Selectors);
  /**
   * Non-reactive values such as refs, callbacks, etc.
   */
  readonly context: Context;
  /**
   * Keeps track of which properties are controlled.
   */
  private controlledValues;
  private selectors;
  /**
   * Synchronizes a single external value into the store.
   *
   * Note that the while the value in `state` is updated immediately, the value returned
   * by `useState` is updated before the next render (similarly to React's `useState`).
   */
  useSyncedValue<Key extends keyof State, Value extends State[Key]>(key: keyof State, value: Value): void;
  /**
   * Synchronizes a single external value into the store and
   * cleans it up (sets to `undefined`) on unmount.
   *
   * Note that the while the value in `state` is updated immediately, the value returned
   * by `useState` is updated before the next render (similarly to React's `useState`).
   */
  useSyncedValueWithCleanup<Key extends KeysAllowingUndefined<State>>(key: Key, value: State[Key]): void;
  /**
   * Synchronizes multiple external values into the store.
   *
   * Note that the while the values in `state` are updated immediately, the values returned
   * by `useState` are updated before the next render (similarly to React's `useState`).
   */
  useSyncedValues(statePart: Partial<State>): void;
  /**
   * Registers a controllable prop pair (`controlled`, `defaultValue`) for a specific key.
   * - If `controlled` is non-undefined, the key is marked as controlled and the store's
   *   state at `key` is updated to match `controlled`. Local writes to that key are ignored.
   * - If `controlled` is undefined, the key is marked as uncontrolled. The store's state
   *   is initialized to `defaultValue` on first render and can be updated with local writes.
   */
  useControlledProp<Key extends keyof State, Value extends State[Key]>(key: keyof State, controlled: Value | undefined, defaultValue: Value): void;
  /**
   * Sets a specific key in the store's state to a new value and notifies listeners if the value has changed.
   * If the key is controlled (registered via {@link useControlledProp} with a non-undefined value),
   * the update is ignored and no listeners are notified.
   *
   * @param key The state key to update.
   * @param value The new value to set for the specified key.
   */
  set<T>(key: keyof State, value: T): void;
  /**
   * Merges the provided changes into the current state and notifies listeners if there are changes.
   * Controlled keys are filtered out and not updated.
   *
   * @param values An object containing the changes to apply to the current state.
   */
  update(values: Partial<State>): void;
  /**
   * Updates the entire store's state and notifies all registered listeners.
   * Controlled keys are left unchanged; only uncontrolled keys from `newState` are applied.
   *
   * @param newState The new state to set for the store.
   */
  setState(newState: State): void;
  /** Gets the current value from the store using a selector with the provided key.
   *
   * @param key Key of the selector to use.
   */
  select: ReactStoreSelectorMethod<Selectors>;
  /**
   * Returns a value from the store's state using a selector function.
   * Used to subscribe to specific parts of the state.
   * This methods causes a rerender whenever the selected state changes.
   *
   * @param key Key of the selector to use.
   */
  useState: ReactStoreSelectorMethod<Selectors>;
  /**
   * Wraps a function with `useStableCallback` to ensure it has a stable reference
   * and assigns it to the context.
   *
   * @param key Key of the event callback. Must be a function in the context.
   * @param fn Function to assign.
   */
  useContextCallback<Key extends ContextFunctionKeys<Context>>(key: Key, fn: ContextFunction<Context, Key> | undefined): void;
  /**
   * Returns a stable setter function for a specific key in the store's state.
   * It's commonly used to pass as a ref callback to React elements.
   *
   * @param key Key of the state to set.
   */
  useStateSetter<const Key extends keyof State, Value extends State[Key]>(key: keyof State): (v: Value) => void;
  /**
   * Observes changes derived from the store's selectors and calls the listener when the selected value changes.
   *
   * @param key Key of the selector to observe.
   * @param listener Listener function called when the selector result changes.
   */
  observe<Key extends keyof Selectors>(selector: Key, listener: (newValue: ReturnType<Selectors[Key]>, oldValue: ReturnType<Selectors[Key]>, store: this) => void): () => void;
  observe<Selector extends ObserveSelector<State>>(selector: Selector, listener: (newValue: ReturnType<Selector>, oldValue: ReturnType<Selector>, store: this) => void): () => void;
}
type MaybeCallable = (...args: any[]) => any;
type ContextFunctionKeys<Context> = { [Key in keyof Context]-?: Extract<Context[Key], MaybeCallable> extends never ? never : Key }[keyof Context];
type ContextFunction<Context, Key extends keyof Context> = Extract<Context[Key], MaybeCallable>;
type KeysAllowingUndefined<State> = { [Key in keyof State]-?: undefined extends State[Key] ? Key : never }[keyof State];
type ReactStoreSelectorMethod<Selectors extends Record<PropertyKey, SelectorFunction<any>>> = <Key extends keyof Selectors>(key: Key, ...args: SelectorArgs<Selectors[Key]>) => ReturnType<Selectors[Key]>;
type ObserveSelector<State> = (state: State) => any;
type SelectorFunction<State> = (state: State, ...args: any[]) => any;
type Tail<T extends readonly any[]> = T extends readonly [any, ...infer Rest] ? Rest : [];
type SelectorArgs<Selector> = Selector extends ((...params: infer Params) => any) ? Tail<Params> : never;
export {};