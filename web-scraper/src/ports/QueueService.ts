import { Sale } from '../core/types';

export default interface QueueService {
  sendBatchMessages(sales: Sale[]): Promise<void>;
}
