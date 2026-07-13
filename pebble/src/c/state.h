#pragma once
#include <pebble.h>

#define MAX_DEVICES 10
#define MAX_NAME_LEN 32
#define MAX_CLASS_LEN 12
#define MAX_DISTANCE_LEN 24
#define MAX_BATTERY_LEN 32
#define MAX_FAVORITES 10

#define PERSIST_KEY_SELECTED     0
#define PERSIST_KEY_FAVORITES    1
#define PERSIST_KEY_DEVICE_COUNT 2
// Each cached device is stored in its own key (a Device exceeds the 256-byte
// per-key persist limit only in aggregate, so one key per device).
#define PERSIST_KEY_DEVICES_BASE 10

typedef struct {
  char name[MAX_NAME_LEN];
  char device_class[MAX_CLASS_LEN];
  char distance_text[MAX_DISTANCE_LEN];
  char battery_text[MAX_BATTERY_LEN];
  int battery_percent;
  bool battery_charging;
} Device;

typedef struct {
  Device devices[MAX_DEVICES];
  int device_count;
  int selected_index;
  int connection_state;
  // True once a fresh device sync has arrived from PKJS this session. Devices
  // restored from persist storage show immediately but keep synced=false, so
  // the UI can withhold actions (ping) that need a live phone session.
  bool synced;
  bool busy;
  char ping_result[16];
  char favorites[MAX_FAVORITES][MAX_NAME_LEN];
  int favorite_count;
} AppState;

// Global app state
extern AppState s_state;

// Persistence helpers
void state_load(void);
void state_save(void);
bool state_is_favorite(const char *name);
void state_toggle_favorite(const char *name);

// Parse device list JSON from PKJS: [["name","class","distance","battery"],...]
void state_parse_devices(const char *json);
