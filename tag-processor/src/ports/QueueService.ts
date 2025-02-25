import SaleMessage from '../core/SaleMessage';

export default interface QueueService {
  getSalesMessages(): SaleMessage[];
}
