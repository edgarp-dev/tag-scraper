export interface CacheService {
    get(key: string): Record<string, unknown> | undefined;
    set(key: string): void;
}
