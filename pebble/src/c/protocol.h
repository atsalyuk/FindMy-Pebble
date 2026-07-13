#pragma once

// AppMessage keys (must match shared/transport.ts)
#define MSG_KEY_ACTION        17001
#define MSG_KEY_RESULT        17002
#define MSG_KEY_DETAIL        17003
#define MSG_KEY_SUMMARY       17004
#define MSG_KEY_STATE         17005
#define MSG_KEY_DEVICES       17006
#define MSG_KEY_SELECTED_IDX  17007
#define MSG_KEY_RESET         17008
#define PKJS_READY_KEY        15025

// Actions (watch → phone)
#define ACTION_PING  1
#define ACTION_SYNC  2

// Result codes (phone → watch)
#define RESULT_SUCCESS           1
#define RESULT_RECONNECT_NEEDED  2
#define RESULT_FAILURE           3

// Connection state codes (phone → watch)
#define STATE_DISCONNECTED  1
#define STATE_CONNECTING    2
#define STATE_CONNECTED     3
#define STATE_DEGRADED      4
#define STATE_NEEDS_REAUTH  5
