function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;

  if (typeof a === 'object') {
    if (Array.isArray(a)) {
      if (!Array.isArray(b) || a.length !== b.length) return false;
      return a.every((item, index) => deepEqual(item, b[index]));
    } else {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(key => Object.hasOwn(b, key) && deepEqual(a[key], b[key]));
    }
  }

  return false;
}

function shallowEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}

export {
  deepEqual,
  shallowEqual
};