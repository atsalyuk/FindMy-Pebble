export const APP_MESSAGE_KEYS = {
  action: 17001,
  result: 17002,
  detail: 17003,
  summary: 17004,
  state: 17005,
  devices: 17006,
  selectedIndex: 17007,
  reset: 17008,
  launchIndex: 17009
} as const;

export const APP_ACTIONS = {
  ping: 1,
  sync: 2
} as const;

export const APP_RESULT_CODES = {
  success: 1,
  reconnectNeeded: 2,
  failure: 3
} as const;

export const APP_STATE_CODES = {
  disconnected: 1,
  connecting: 2,
  connected: 3,
  degraded: 4,
  needsReauth: 5
} as const;
