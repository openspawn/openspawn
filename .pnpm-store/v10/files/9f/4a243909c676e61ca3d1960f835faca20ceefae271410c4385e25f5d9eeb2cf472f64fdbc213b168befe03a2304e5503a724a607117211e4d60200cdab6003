"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ReactStore = void 0;
var React = _interopRequireWildcard(require("react"));
var _Store = require("./Store");
var _useStore = require("./useStore");
var _useStableCallback = require("../useStableCallback");
var _useIsoLayoutEffect = require("../useIsoLayoutEffect");
var _empty = require("../empty");
/* False positives - ESLint thinks we're calling a hook from a class component. */
/* eslint-disable react-hooks/rules-of-hooks */

/**
 * A Store that supports controlled state keys, non-reactive values and provides utility methods for React.
 */
class ReactStore extends _Store.Store {
  /**
   * Creates a new ReactStore instance.
   *
   * @param state Initial state of the store.
   * @param context Non-reactive context values.
   * @param selectors Optional selectors for use with `useState`.
   */
  constructor(state, context = {}, selectors) {
    super(state);
    this.context = context;
    this.selectors = selectors;
  }

  /**
   * Non-reactive values such as refs, callbacks, etc.
   */

  /**
   * Keeps track of which properties are controlled.
   */
  controlledValues = new Map();
  /**
   * Synchronizes a single external value into the store.
   *
   * Note that the while the value in `state` is updated immediately, the value returned
   * by `useState` is updated before the next render (similarly to React's `useState`).
   */
  useSyncedValue(key, value) {
    React.useDebugValue(key);
    (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
      if (this.state[key] !== value) {
        this.set(key, value);
      }
    }, [key, value]);
  }

  /**
   * Synchronizes a single external value into the store and
   * cleans it up (sets to `undefined`) on unmount.
   *
   * Note that the while the value in `state` is updated immediately, the value returned
   * by `useState` is updated before the next render (similarly to React's `useState`).
   */
  useSyncedValueWithCleanup(key, value) {
    // eslint-disable-next-line consistent-this
    const store = this;
    (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
      if (store.state[key] !== value) {
        store.set(key, value);
      }
      return () => {
        store.set(key, undefined);
      };
    }, [store, key, value]);
  }

  /**
   * Synchronizes multiple external values into the store.
   *
   * Note that the while the values in `state` are updated immediately, the values returned
   * by `useState` are updated before the next render (similarly to React's `useState`).
   */
  useSyncedValues(statePart) {
    // eslint-disable-next-line consistent-this
    const store = this;
    if (process.env.NODE_ENV !== 'production') {
      // Check that an object with the same shape is passed on every render
      React.useDebugValue(statePart, p => Object.keys(p));
      const keys = React.useRef(Object.keys(statePart)).current;
      const nextKeys = Object.keys(statePart);
      if (keys.length !== nextKeys.length || keys.some((key, index) => key !== nextKeys[index])) {
        console.error('ReactStore.useSyncedValues expects the same prop keys on every render. Keys should be stable.');
      }
    }
    const dependencies = Object.values(statePart);
    (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
      store.update(statePart);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [store, ...dependencies]);
  }

  /**
   * Registers a controllable prop pair (`controlled`, `defaultValue`) for a specific key.
   * - If `controlled` is non-undefined, the key is marked as controlled and the store's
   *   state at `key` is updated to match `controlled`. Local writes to that key are ignored.
   * - If `controlled` is undefined, the key is marked as uncontrolled. The store's state
   *   is initialized to `defaultValue` on first render and can be updated with local writes.
   */
  useControlledProp(key, controlled, defaultValue) {
    React.useDebugValue(key);
    // eslint-disable-next-line consistent-this
    const store = this;
    const isControlled = controlled !== undefined;
    if (process.env.NODE_ENV !== 'production') {
      const previouslyControlled = this.controlledValues.get(key);
      if (previouslyControlled !== undefined && previouslyControlled !== isControlled) {
        console.error(`A component is changing the ${isControlled ? '' : 'un'}controlled state of ${key.toString()} to be ${isControlled ? 'un' : ''}controlled. Elements should not switch from uncontrolled to controlled (or vice versa).`);
      }
    }
    if (!this.controlledValues.has(key)) {
      // First time initialization
      this.controlledValues.set(key, isControlled);
      if (!isControlled && !Object.is(this.state[key], defaultValue)) {
        super.setState({
          ...this.state,
          [key]: defaultValue
        });
      }
    }
    (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
      if (isControlled && !Object.is(store.state[key], controlled)) {
        // Set the internal state to match the controlled value.
        super.setState({
          ...store.state,
          [key]: controlled
        });
      }
    }, [store, key, controlled, defaultValue, isControlled]);
  }

  /**
   * Sets a specific key in the store's state to a new value and notifies listeners if the value has changed.
   * If the key is controlled (registered via {@link useControlledProp} with a non-undefined value),
   * the update is ignored and no listeners are notified.
   *
   * @param key The state key to update.
   * @param value The new value to set for the specified key.
   */
  set(key, value) {
    if (this.controlledValues.get(key) === true) {
      // Ignore updates to controlled values
      return;
    }
    super.set(key, value);
  }

  /**
   * Merges the provided changes into the current state and notifies listeners if there are changes.
   * Controlled keys are filtered out and not updated.
   *
   * @param values An object containing the changes to apply to the current state.
   */
  update(values) {
    const newValues = {
      ...values
    };
    for (const key in newValues) {
      if (!Object.hasOwn(newValues, key)) {
        continue;
      }
      if (this.controlledValues.get(key) === true) {
        // Ignore updates to controlled values
        delete newValues[key];
        continue;
      }
    }
    super.update(newValues);
  }

  /**
   * Updates the entire store's state and notifies all registered listeners.
   * Controlled keys are left unchanged; only uncontrolled keys from `newState` are applied.
   *
   * @param newState The new state to set for the store.
   */
  setState(newState) {
    const newValues = {
      ...newState
    };
    for (const key in newValues) {
      if (!Object.hasOwn(newValues, key)) {
        continue;
      }
      if (this.controlledValues.get(key) === true) {
        // Ignore updates to controlled values
        delete newValues[key];
        continue;
      }
    }
    super.setState({
      ...this.state,
      ...newValues
    });
  }

  /** Gets the current value from the store using a selector with the provided key.
   *
   * @param key Key of the selector to use.
   */
  select = (key, a1, a2, a3) => {
    const selector = this.selectors[key];
    return selector(this.state, a1, a2, a3);
  };

  /**
   * Returns a value from the store's state using a selector function.
   * Used to subscribe to specific parts of the state.
   * This methods causes a rerender whenever the selected state changes.
   *
   * @param key Key of the selector to use.
   */
  useState = (key, a1, a2, a3) => {
    React.useDebugValue(key);
    const selector = this.selectors[key];
    const value = (0, _useStore.useStore)(this, selector, a1, a2, a3);
    return value;
  };

  /**
   * Wraps a function with `useStableCallback` to ensure it has a stable reference
   * and assigns it to the context.
   *
   * @param key Key of the event callback. Must be a function in the context.
   * @param fn Function to assign.
   */
  useContextCallback(key, fn) {
    React.useDebugValue(key);
    const stableFunction = (0, _useStableCallback.useStableCallback)(fn ?? _empty.NOOP);
    this.context[key] = stableFunction;
  }

  /**
   * Returns a stable setter function for a specific key in the store's state.
   * It's commonly used to pass as a ref callback to React elements.
   *
   * @param key Key of the state to set.
   */
  useStateSetter(key) {
    const ref = React.useRef(undefined);
    if (ref.current === undefined) {
      ref.current = value => {
        this.set(key, value);
      };
    }
    return ref.current;
  }

  /**
   * Observes changes derived from the store's selectors and calls the listener when the selected value changes.
   *
   * @param key Key of the selector to observe.
   * @param listener Listener function called when the selector result changes.
   */

  observe(selector, listener) {
    let selectFn;
    if (typeof selector === 'function') {
      selectFn = selector;
    } else {
      selectFn = this.selectors[selector];
    }
    let prevValue = selectFn(this.state);
    listener(prevValue, prevValue, this);
    return this.subscribe(nextState => {
      const nextValue = selectFn(nextState);
      if (!Object.is(prevValue, nextValue)) {
        const oldValue = prevValue;
        prevValue = nextValue;
        listener(nextValue, oldValue, this);
      }
    });
  }
}
exports.ReactStore = ReactStore;