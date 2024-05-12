import NodeCache from 'node-cache';
import { CacheService } from '../ports';

export default class NodeCacheAdapter implements CacheService {
    private readonly nodeCacheClient: NodeCache;

    constructor() {
        this.nodeCacheClient = new NodeCache({
            stdTTL: 86400,
            checkperiod: 60
        });
    }
    get(key: string): Record<string, unknown> | undefined {
        return this.nodeCacheClient.get(key);
    }
    set(key: string): void {
        this.nodeCacheClient.set(key, key);
    }
}
