import crypto from "crypto"

export default <T>(Arr: T[]): T => Arr[crypto.randomInt(Arr.length)];