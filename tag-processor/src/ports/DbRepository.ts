import Sale from '../core/Sale';

export default interface DbRepository {
    create(sale: Sale): Promise<void>;

    get(key: string): Promise<Record<string, unknown> | undefined>;
}
