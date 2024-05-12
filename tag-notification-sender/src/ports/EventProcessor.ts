import Message from '../core/Message';

export default interface EventProcessor {
    getMessages(): Message[];
}
