#include <pebble.h>
#include "protocol.h"
#include "state.h"
#include "battery_icons.h"
#include "list_window.h"
#include "detail_window.h"

AppState s_state;

static uint32_t app_message_inbox_size(void) {
#if defined(PBL_PLATFORM_APLITE)
  return 256;
#else
  return app_message_inbox_size_maximum();
#endif
}

static uint32_t app_message_outbox_size(void) {
#if defined(PBL_PLATFORM_APLITE)
  return 64;
#else
  return app_message_outbox_size_maximum();
#endif
}

// ── Persistence ────────────────────────────────────────────────────────────

void state_load(void) {
  s_state.selected_index = persist_exists(PERSIST_KEY_SELECTED) ? persist_read_int(PERSIST_KEY_SELECTED) : 0;
  s_state.favorite_count = 0;
  if (persist_exists(PERSIST_KEY_FAVORITES)) {
    persist_read_data(PERSIST_KEY_FAVORITES, s_state.favorites, sizeof(s_state.favorites));
    // Count non-empty favorites
    for (int i = 0; i < MAX_FAVORITES; i++) {
      if (s_state.favorites[i][0] != '\0') s_state.favorite_count = i + 1;
    }
  }

  // Restore the last-known device list so it shows instantly on launch, while
  // a fresh sync runs in the background (stale-while-revalidate).
  s_state.device_count = 0;
  if (persist_exists(PERSIST_KEY_DEVICE_COUNT)) {
    int count = persist_read_int(PERSIST_KEY_DEVICE_COUNT);
    if (count > MAX_DEVICES) count = MAX_DEVICES;
    for (int i = 0; i < count; i++) {
      if (persist_exists(PERSIST_KEY_DEVICES_BASE + i)) {
        persist_read_data(PERSIST_KEY_DEVICES_BASE + i, &s_state.devices[i], sizeof(Device));
        s_state.device_count++;
      }
    }
  }
  if (s_state.selected_index >= s_state.device_count) {
    s_state.selected_index = s_state.device_count > 0 ? s_state.device_count - 1 : 0;
  }
  // Show the cached devices as "connected" rather than "Connecting…"; the
  // background sync will correct the state if the session actually needs re-auth.
  if (s_state.device_count > 0) {
    s_state.connection_state = STATE_CONNECTED;
  }
}

void state_save(void) {
  persist_write_int(PERSIST_KEY_SELECTED, s_state.selected_index);
  persist_write_data(PERSIST_KEY_FAVORITES, s_state.favorites, sizeof(s_state.favorites));
  persist_write_int(PERSIST_KEY_DEVICE_COUNT, s_state.device_count);
  for (int i = 0; i < s_state.device_count && i < MAX_DEVICES; i++) {
    persist_write_data(PERSIST_KEY_DEVICES_BASE + i, &s_state.devices[i], sizeof(Device));
  }
}

bool state_is_favorite(const char *name) {
  for (int i = 0; i < MAX_FAVORITES; i++) {
    if (s_state.favorites[i][0] && strcmp(s_state.favorites[i], name) == 0) return true;
  }
  return false;
}

void state_toggle_favorite(const char *name) {
  // Check if already a favorite — remove it
  for (int i = 0; i < MAX_FAVORITES; i++) {
    if (s_state.favorites[i][0] && strcmp(s_state.favorites[i], name) == 0) {
      s_state.favorites[i][0] = '\0';
      state_save();
      return;
    }
  }
  // Add to first empty slot
  for (int i = 0; i < MAX_FAVORITES; i++) {
    if (s_state.favorites[i][0] == '\0') {
      strncpy(s_state.favorites[i], name, MAX_NAME_LEN - 1);
      s_state.favorites[i][MAX_NAME_LEN - 1] = '\0';
      state_save();
      return;
    }
  }
}

// ── JSON device parsing ────────────────────────────────────────────────────
// Format: [["name","class","distance","battery"],...]

static void skip_to_next_quote(const char **cursor) {
  while (**cursor && **cursor != '"') (*cursor)++;
}

static void read_quoted_value(const char **cursor, char *dst, size_t dst_size) {
  if (dst_size == 0) {
    return;
  }

  skip_to_next_quote(cursor);
  if (**cursor != '"') {
    dst[0] = '\0';
    return;
  }

  (*cursor)++;
  size_t len = 0;
  while (**cursor && **cursor != '"' && len + 1 < dst_size) {
    dst[len++] = **cursor;
    (*cursor)++;
  }
  dst[len] = '\0';

  while (**cursor && **cursor != '"') {
    (*cursor)++;
  }
  if (**cursor == '"') {
    (*cursor)++;
  }
}

void state_parse_devices(const char *json) {
  char previous_selected_name[MAX_NAME_LEN];
  previous_selected_name[0] = '\0';
  if (s_state.selected_index >= 0 && s_state.selected_index < s_state.device_count) {
    strncpy(previous_selected_name, s_state.devices[s_state.selected_index].name, sizeof(previous_selected_name) - 1);
    previous_selected_name[sizeof(previous_selected_name) - 1] = '\0';
  }

  s_state.device_count = 0;
  if (!json || json[0] != '[') return;

  const char *p = json + 1; // skip opening [
  while (*p && s_state.device_count < MAX_DEVICES) {
    // Find opening [ of inner array
    while (*p && *p != '[') p++;
    if (!*p) break;
    p++; // skip [

    Device *device = &s_state.devices[s_state.device_count];
    read_quoted_value(&p, device->name, sizeof(device->name));
    read_quoted_value(&p, device->device_class, sizeof(device->device_class));
    read_quoted_value(&p, device->distance_text, sizeof(device->distance_text));
    read_quoted_value(&p, device->battery_text, sizeof(device->battery_text));
    device->battery_percent = battery_icon_percent_from_text(device->battery_text);
    device->battery_charging = battery_icon_is_charging_from_text(device->battery_text);

    s_state.device_count++;

    // Skip to closing ] of inner array
    while (*p && *p != ']') p++;
    if (*p) p++;
  }

  if (previous_selected_name[0] != '\0') {
    for (int i = 0; i < s_state.device_count; i++) {
      if (strcmp(s_state.devices[i].name, previous_selected_name) == 0) {
        s_state.selected_index = i;
        return;
      }
    }
  }

  // Clamp selected index
  if (s_state.selected_index >= s_state.device_count) {
    s_state.selected_index = s_state.device_count > 0 ? s_state.device_count - 1 : 0;
  }
}

// Forward declarations
void app_request_sync(void);
void app_request_ping(void);

static void finish_ping_callback(void *data) {
  s_state.busy = false;
  detail_window_refresh();
}

// ── AppMessage ─────────────────────────────────────────────────────────────

static void send_action(int action) {
  DictionaryIterator *iter;
  AppMessageResult r = app_message_outbox_begin(&iter);
  if (r != APP_MSG_OK) {
    APP_LOG(APP_LOG_LEVEL_ERROR, "outbox_begin failed: %d", r);
    s_state.busy = false;
    return;
  }
  dict_write_int32(iter, MSG_KEY_ACTION, action);
  if (action == ACTION_PING) {
    dict_write_int32(iter, MSG_KEY_SELECTED_IDX, s_state.selected_index);
  }
  r = app_message_outbox_send();
  if (r != APP_MSG_OK) {
    s_state.busy = false;
  }
  APP_LOG(APP_LOG_LEVEL_INFO, "sent action=%d result=%d", action, r);
}

// Retry loop: until a fresh device sync arrives this session, keep
// re-requesting one (recovers from PKJS not being ready yet after the app was
// backgrounded for hours, or a sync request that never got answered). Cached
// devices satisfy the display but not this loop — the ping action stays
// hidden until PKJS answers. Self-reschedules until then or the attempt cap.
#define SYNC_RETRY_MS 8000
#define SYNC_MAX_RETRIES 10
static AppTimer *s_sync_timer = NULL;
static int s_sync_attempts = 0;

static void sync_timer_callback(void *data);

static void schedule_sync_retry(void) {
  if (s_sync_timer) {
    app_timer_cancel(s_sync_timer);
  }
  s_sync_timer = app_timer_register(SYNC_RETRY_MS, sync_timer_callback, NULL);
}

static void cancel_sync_retry(void) {
  if (s_sync_timer) {
    app_timer_cancel(s_sync_timer);
    s_sync_timer = NULL;
  }
  s_sync_attempts = 0;
}

static void sync_timer_callback(void *data) {
  s_sync_timer = NULL;
  if (s_state.synced) {
    return; // fresh data arrived — stop retrying
  }
  if (s_sync_attempts >= SYNC_MAX_RETRIES) {
    APP_LOG(APP_LOG_LEVEL_INFO, "sync retry: giving up after %d attempts", s_sync_attempts);
    return;
  }
  // A previous request never got a reply — unstick busy so we can retry.
  s_state.busy = false;
  s_sync_attempts++;
  APP_LOG(APP_LOG_LEVEL_INFO, "sync retry #%d", s_sync_attempts);
  app_request_sync();
  schedule_sync_retry();
}

void app_request_sync(void) {
  if (s_state.busy) return;
  s_state.busy = true;
  s_state.connection_state = STATE_CONNECTING;
  send_action(ACTION_SYNC);
}

void app_request_ping(void) {
  // No pinging against cached data — wait for a fresh sync from PKJS.
  if (s_state.busy || s_state.device_count == 0 || !s_state.synced) return;
  s_state.busy = true;
  s_state.ping_result[0] = '\0';
  send_action(ACTION_PING);
}

static void inbox_received(DictionaryIterator *iter, void *context) {
  // Check for ready ack
  Tuple *ready = dict_find(iter, PKJS_READY_KEY);
  if (ready) {
    APP_LOG(APP_LOG_LEVEL_INFO, "got ready ack, requesting sync");
    app_request_sync();
    if (!s_state.synced) {
      s_sync_attempts = 0; // PKJS (re)started — restart the retry cycle
      schedule_sync_retry();
    }
    return;
  }

  Tuple *reset_tuple = dict_find(iter, MSG_KEY_RESET);
  if (reset_tuple && reset_tuple->value[0].int32) {
    memset(s_state.favorites, 0, sizeof(s_state.favorites));
    s_state.favorite_count = 0;
    s_state.selected_index = 0;
    s_state.device_count = 0;
    s_state.busy = false;
    s_state.ping_result[0] = '\0';
    persist_delete(PERSIST_KEY_SELECTED);
    persist_delete(PERSIST_KEY_FAVORITES);
    persist_delete(PERSIST_KEY_DEVICE_COUNT);
    for (int i = 0; i < MAX_DEVICES; i++) {
      persist_delete(PERSIST_KEY_DEVICES_BASE + i);
    }
  }

  // State update
  Tuple *state_tuple = dict_find(iter, MSG_KEY_STATE);
  if (state_tuple) {
    s_state.connection_state = (int)state_tuple->value[0].int32;
  }

  // Device list (sync response)
  Tuple *selected_tuple = dict_find(iter, MSG_KEY_SELECTED_IDX);
  Tuple *devices_tuple = dict_find(iter, MSG_KEY_DEVICES);
  if (devices_tuple) {
    bool had_selected_device =
      s_state.selected_index >= 0
      && s_state.selected_index < s_state.device_count
      && s_state.devices[s_state.selected_index].name[0] != '\0';
    APP_LOG(APP_LOG_LEVEL_INFO, "got devices: %.80s", devices_tuple->value[0].cstring);
    state_parse_devices(devices_tuple->value[0].cstring);
    if (!had_selected_device && selected_tuple) {
      int selected = (int)selected_tuple->value[0].int32;
      if (selected < 0) {
        selected = 0;
      }
      if (selected >= s_state.device_count) {
        selected = s_state.device_count > 0 ? s_state.device_count - 1 : 0;
      }
      s_state.selected_index = selected;
    }
    APP_LOG(APP_LOG_LEVEL_INFO, "parsed %d devices", s_state.device_count);
    s_state.busy = false;
    // A fresh answer from PKJS means we're synced even if the account has no
    // devices — stop the retry loop either way.
    s_state.synced = true;
    cancel_sync_retry();
    state_save();
    list_window_reload();
    detail_window_refresh();
    return;
  }

  // Ping result — defer clearing busy so animation plays at least 2 seconds
  Tuple *result_tuple = dict_find(iter, MSG_KEY_RESULT);
  if (result_tuple) {
    int result = (int)result_tuple->value[0].int32;
    if (result == RESULT_SUCCESS) {
      strncpy(s_state.ping_result, "success", sizeof(s_state.ping_result));
    } else {
      strncpy(s_state.ping_result, "failure", sizeof(s_state.ping_result));
    }
    // Keep animating for at least 2s total, then show result
    app_timer_register(2000, finish_ping_callback, NULL);
    // Detail window will pick up the change on next redraw
    return;
  }
}

static void inbox_dropped(AppMessageResult reason, void *context) {
  APP_LOG(APP_LOG_LEVEL_ERROR, "Message dropped: %d", reason);
}

static void outbox_sent(DictionaryIterator *iter, void *context) {
  APP_LOG(APP_LOG_LEVEL_INFO, "outbox_sent OK");
}

static void outbox_failed(DictionaryIterator *iter, AppMessageResult reason, void *context) {
  APP_LOG(APP_LOG_LEVEL_ERROR, "Outbox failed: %d", reason);
  s_state.busy = false;
}

// ── App lifecycle ──────────────────────────────────────────────────────────

static void init(void) {
  memset(&s_state, 0, sizeof(s_state));
  s_state.connection_state = STATE_CONNECTING;
  state_load();

  // AppMessage
  app_message_register_inbox_received(inbox_received);
  app_message_register_inbox_dropped(inbox_dropped);
  app_message_register_outbox_sent(outbox_sent);
  app_message_register_outbox_failed(outbox_failed);
  const uint32_t inbox_size = app_message_inbox_size();
  const uint32_t outbox_size = app_message_outbox_size();
  AppMessageResult result = app_message_open(inbox_size, outbox_size);
  APP_LOG(APP_LOG_LEVEL_INFO, "app_message_open: %d (in=%lu out=%lu)", result, (unsigned long)inbox_size, (unsigned long)outbox_size);

  // Show list window
  list_window_push();
  APP_LOG(APP_LOG_LEVEL_INFO, "FindMy for Pebble C app initialized");

  // Proactively request sync after a short delay (PKJS may already be ready).
  // The callback self-reschedules while no devices are loaded, so a slow PKJS
  // wake-up or a dropped sync no longer leaves the watch stuck on "Connecting".
  s_sync_attempts = 0;
  s_sync_timer = app_timer_register(2000, sync_timer_callback, NULL);
}

static void deinit(void) {
  state_save();
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}
