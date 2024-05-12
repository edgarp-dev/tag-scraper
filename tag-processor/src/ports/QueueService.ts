import Sale from '../core/Sale';

export default interface QueueService {
    getSalesMessages(): Sale[];
}
