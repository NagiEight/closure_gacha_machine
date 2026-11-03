import crypto from "crypto";
/**
 * Pick a random item from an array.
 *
 * @throws If arr is empty.
 */
export default (Arr) => Arr[crypto.randomInt(Arr.length)];
