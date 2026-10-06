export default abstract class EnvDataType<T> {
    protected DefaultValue?: T;
    public abstract Parse(Name: string): T;
    public abstract Default(Value: T): this;
}