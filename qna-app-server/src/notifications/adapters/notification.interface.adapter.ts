export interface NotifacationAdapterInterface {
  send(recipient: string, subject: string, body: string): Promise<void>;
}
