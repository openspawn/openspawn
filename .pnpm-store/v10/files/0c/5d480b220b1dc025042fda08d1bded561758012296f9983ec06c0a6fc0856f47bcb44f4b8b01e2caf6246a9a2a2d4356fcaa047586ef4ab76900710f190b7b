import { generateId } from '@base-ui/utils/generateId';
/**
 * Creates a new toast manager.
 */
export function createToastManager() {
  const listeners = [];
  function emit(data) {
    listeners.forEach(listener => listener(data));
  }
  return {
    // This should be private aside from ToastProvider needing to access it.
    // https://x.com/drosenwasser/status/1816947740032872664
    ' subscribe': function subscribe(listener) {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      };
    },
    add(options) {
      const id = options.id || generateId('toast');
      const toastToAdd = {
        ...options,
        id,
        transitionStatus: 'starting'
      };
      emit({
        action: 'add',
        options: toastToAdd
      });
      return id;
    },
    close(id) {
      emit({
        action: 'close',
        options: {
          id
        }
      });
    },
    update(id, updates) {
      emit({
        action: 'update',
        options: {
          ...updates,
          id
        }
      });
    },
    promise(promiseValue, options) {
      let handledPromise = promiseValue;
      emit({
        action: 'promise',
        options: {
          ...options,
          promise: promiseValue,
          setPromise(promise) {
            handledPromise = promise;
          }
        }
      });
      return handledPromise;
    }
  };
}