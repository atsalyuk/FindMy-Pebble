export type PingResult = "success" | "reconnect_needed" | "failure";
export type ConnectionState = "disconnected" | "connecting" | "connected" | "degraded" | "needs_reauth";
export type LocalMode = "mock_local" | "local_bridge" | "direct_apple";
export type MockScenario = "healthy" | "degraded" | "expired";
export type ConnectionProvider = "mock_local" | "local_bridge" | "direct_apple";

export interface DeviceSummary {
  id: string;
  name: string;
  deviceClass: "iPhone" | "iPad" | "Mac";
  batteryLevelPercent?: number;
  isCharging?: boolean;
  distanceMeters?: number;
}

export interface SyncResponse {
  devices: DeviceSummary[];
  connection: ConnectionHealth;
  appleId?: string;
}

export interface AppleSessionBundle {
  provider: ConnectionProvider;
  appleId: string;
  createdAt: string;
  updatedAt: string;
  defaultDeviceId: string;
  scenario?: MockScenario;
  playSoundUrl?: string;
  cookieHeader?: string;
  bridgeBaseUrl?: string;
  serviceRoot?: string;
  dsid?: string;
  clientId?: string;
  serverContext?: Record<string, unknown>;
  sessionToken?: string;
  trustToken?: string;
  accountCountry?: string;
  scnt?: string;
  sessionId?: string;
  authAttributes?: string;
}

export interface ConnectionHealth {
  state: ConnectionState;
  summary: string;
  provider: ConnectionProvider;
  lastCheckedAt?: string;
  defaultDeviceId?: string;
}

export interface LocalAppState {
  mode: LocalMode;
  session?: AppleSessionBundle;
  devices: DeviceSummary[];
  connection: ConnectionHealth;
}

export interface PingResponse {
  result: PingResult;
  detail: string;
  connection: ConnectionHealth;
}
