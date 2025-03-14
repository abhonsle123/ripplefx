
export interface BrokerConnection {
  id: string;
  broker_name: string;
  api_key: string;
  api_secret: string;
  is_active: boolean;
  created_at: string;
}
