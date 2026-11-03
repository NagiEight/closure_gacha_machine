const Branding = Symbol.for("UserDatabase");
export default class UserDatabase {
    [Branding] = true;
    /**
     * An async method that used for setting up database (create table, setting pragmas,...) of async database libraries, or do various async works that might not be possible in a class constructor.
     * @returns A new instance of the database manager or the same one that used to call this method.
     */
    async Initialize() {
        return this;
    }
    static [Symbol.hasInstance](Obj) {
        return typeof Obj === "object"
            && Obj !== null
            && Branding in Obj;
    }
}
