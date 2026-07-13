import type { LocalMode, MockScenario } from "./types";

export const APP_NAME = "FindMy for Pebble";

export const AUTO_SEED_LOCAL_STATE = true;
const APP_MODE_VALUE: LocalMode = "direct_apple";
const MOCK_SCENARIO_VALUE: MockScenario = "healthy";

export const MOCK_BOOTSTRAP = {
  appleId: "local-user@example.com",
  defaultDeviceId: "iphone-primary"
};

export const DIRECT_APPLE_BOOTSTRAP = {
  appleId: "",
  defaultDeviceId: "",
  serviceRoot: "",
  dsid: "",
  clientId: "",
  playSoundUrl: "",
  cookieHeader: ""
};

export const getAppMode = (): LocalMode => APP_MODE_VALUE;
export const getMockScenario = (): MockScenario => MOCK_SCENARIO_VALUE;
