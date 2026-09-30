import crypto from "crypto";

/**
 * Pick a random item from an array.
 * 
 * @throws If arr is empty.
 */
export default <T>(Arr: ArrayLike<T>): T => Arr[crypto.randomInt(Arr.length)];
console.log(crypto.randomInt(0));