export default abstract class EnvDataType<T> {
    public DefaultValue?: T;
    public abstract Parse(Name: string): T;
    public abstract Default(Value: T): this;
}