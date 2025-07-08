function isObject(value) {
  return typeof value === 'object' && value !== null;
}

const reactiveCache = new WeakMap();

// Enhances array mutators to call notify()
function enhanceArray(arr, notify) {
  // Wrap elements
  for (let i = 0; i < arr.length; i++) {
    if (isObject(arr[i])) {
      arr[i] = createReactive(arr[i], notify);
    }
  }

  const mutatingMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];

  for (const method of mutatingMethods) {
    const original = arr[method];
    Object.defineProperty(arr, method, {
      configurable: true,
      writable: true,
      enumerable: false,
      value: function (...args) {
        const result = original.apply(this, args);
        notify();
        return result;
      }
    });
  }

  return new Proxy(arr, createObjectHandler(notify));
}

function enhanceMap(map, notify) {
  ['set', 'delete', 'clear'].forEach(method => {
    const original = map[method];
    Object.defineProperty(map, method, {
      configurable: true,
      enumerable: false,
      writable: true,
      value: function (...args) {
        const result = original.apply(this, args);
        notify();
        return result;
      }
    });
  });

  return map;
}

function enhanceSet(set, notify) {
  ['add', 'delete', 'clear'].forEach(method => {
    const original = set[method];
    Object.defineProperty(set, method, {
      configurable: true,
      enumerable: false,
      writable: true,
      value: function (...args) {
        const result = original.apply(this, args);
        notify();
        return result;
      }
    });
  });

  return set;
}

function createObjectHandler(notify) {
  return {
    get(target, prop, receiver) {
      const val = Reflect.get(target, prop, receiver);
      if (isObject(val)) {
        return createReactive(val, notify);
      }
      return val;
    },
    set(target, prop, value) {
      const oldVal = target[prop];
      const newVal = isObject(value) ? createReactive(value, notify) : value;

      if (oldVal !== newVal) {
        target[prop] = newVal;
        notify();
      }
      return true;
    },
    deleteProperty(target, prop) {
      const success = delete target[prop];
      notify();
      return success;
    }
  };
}

function createReactive(obj, notify) {
  if (!isObject(obj)) return obj;

  if (reactiveCache.has(obj)) {
    return reactiveCache.get(obj);
  }

  let proxy;

  if (Array.isArray(obj)) {
    proxy = enhanceArray(obj, notify);
  } else if (obj instanceof Map) {
    proxy = enhanceMap(obj, notify);
  } else if (obj instanceof Set) {
    proxy = enhanceSet(obj, notify);
  } else {
    proxy = new Proxy(obj, createObjectHandler(notify));
  }
  reactiveCache.set(obj, proxy);

  return proxy;
}

// 🌟 PUBLIC API
export function createStore(initial) {
  if (!isObject(initial)) {
    throw new Error('Initial state must be a non-null object');
  }

  const listeners = new Set();

  function notify() {
    for (const cb of listeners) {
      cb(state);
    }
  }

  const state = createReactive(initial, notify);

  function subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Subscribe callback must be a function');
    }

    listeners.add(callback);
    callback(state); // initial sync

    let unsubscribed = false;

    return () => {
      if (!unsubscribed) {
        listeners.delete(callback);
        unsubscribed = true;
      }
    };
  }

  return { state, subscribe };
}
