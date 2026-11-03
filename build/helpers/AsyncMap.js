/**
 * Shorthand function for `Promise.all(Arr.map(CallbackFn))`.
 */
export default (Arr, CallbackFn) => Promise.all(Arr.map(CallbackFn));
