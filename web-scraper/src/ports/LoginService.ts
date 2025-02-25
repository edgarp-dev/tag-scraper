export default interface LoginService {
  login(isLocalHost: boolean): Promise<void>;
}
