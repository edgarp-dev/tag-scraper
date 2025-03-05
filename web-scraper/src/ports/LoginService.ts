import WebScraperService from './WebScraperService';

export default interface LoginService {
  login(webScraperService: WebScraperService): Promise<void>;
}
