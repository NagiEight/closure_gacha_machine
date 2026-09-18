import crypto from "crypto"

export default <T>(Arr: ArrayLike<T>): T => Arr[crypto.randomInt(Arr.length)];