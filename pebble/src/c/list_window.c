#include <pebble.h>
#include "list_window.h"
#include "detail_window.h"
#include "state.h"
#include "battery_icons.h"
#include "layout.h"
#include "protocol.h"

static Window *s_window;
static MenuLayer *s_menu;
static StatusBarLayer *s_status_bar;
static GBitmap *s_heart_list_icon;
static GBitmap *s_heart_list_white_icon;
static bool s_has_initialized_highlight;
static bool s_syncing_selection;

// Sorted index: favorites first, then non-favorites, preserving order within each group
static int s_sorted[MAX_DEVICES];
static int s_sorted_count;

static void rebuild_sorted_index(void) {
  s_sorted_count = 0;
  // First pass: favorites
  for (int i = 0; i < s_state.device_count; i++) {
    if (state_is_favorite(s_state.devices[i].name)) {
      s_sorted[s_sorted_count++] = i;
    }
  }
  // Second pass: non-favorites
  for (int i = 0; i < s_state.device_count; i++) {
    if (!state_is_favorite(s_state.devices[i].name)) {
      s_sorted[s_sorted_count++] = i;
    }
  }
}

static int sorted_device_index(int row) {
  if (row < 0 || row >= s_sorted_count) return 0;
  return s_sorted[row];
}

static int sorted_row_for_selected_device(void) {
  for (int i = 0; i < s_sorted_count; i++) {
    if (s_sorted[i] == s_state.selected_index) {
      return i;
    }
  }
  return 0;
}

static void set_menu_selection_row(int row, bool animated) {
  if (!s_menu || s_state.device_count <= 0) {
    return;
  }

  if (row < 0) {
    row = 0;
  }
  if (row >= s_sorted_count) {
    row = s_sorted_count > 0 ? s_sorted_count - 1 : 0;
  }

  s_syncing_selection = true;
  menu_layer_set_selected_index(
    s_menu,
    MenuIndex(0, row),
    MenuRowAlignCenter,
    animated
  );
  s_syncing_selection = false;
}

static void sync_menu_selection(bool animated) {
  if (!s_menu || s_state.device_count <= 0) {
    return;
  }

  set_menu_selection_row(sorted_row_for_selected_device(), animated);
}

static void select_top_row(bool animated) {
  if (s_state.device_count <= 0) {
    return;
  }

  s_state.selected_index = sorted_device_index(0);
  set_menu_selection_row(0, animated);
}

static GColor list_secondary_text_color(bool selected) {
#ifdef PBL_BW
  return selected ? GColorWhite : GColorBlack;
#else
  return selected ? GColorWhite : GColorDarkGray;
#endif
}

static GColor list_highlight_color(void) {
#ifdef PBL_BW
  return GColorBlack;
#else
  return GColorFromRGB(85, 136, 102);
#endif
}

static BatteryIconStyle list_battery_style(bool selected) {
#ifdef PBL_BW
  return selected ? BATTERY_ICON_STYLE_LIGHT : BATTERY_ICON_STYLE_DARK;
#else
  return selected ? BATTERY_ICON_STYLE_LIGHT : BATTERY_ICON_STYLE_DARK;
#endif
}

// ── MenuLayer callbacks ────────────────────────────────────────────────────

static uint16_t get_num_rows(struct MenuLayer *menu, uint16_t section, void *ctx) {
  if (s_state.device_count == 0) return 1;
  return s_state.device_count;
}

static int16_t get_cell_height(struct MenuLayer *menu, MenuIndex *cell, void *ctx) {
  return FM_IF_ROUND_LAYOUT(52, 44);
}

static void draw_row(GContext *ctx, const Layer *cell_layer, MenuIndex *cell_index, void *ctx2) {
  GRect bounds = layer_get_bounds(cell_layer);
  bool selected = menu_layer_get_selected_index(s_menu).row == cell_index->row;

  if (s_state.device_count == 0) {
    const char *msg = s_state.connection_state == STATE_CONNECTING ? "Connecting..."
      : (s_state.connection_state == STATE_NEEDS_REAUTH || s_state.connection_state == STATE_DISCONNECTED)
        ? "Sign in from phone" : "No devices";
    graphics_context_set_text_color(ctx, list_secondary_text_color(selected));
    graphics_draw_text(ctx, msg, fonts_get_system_font(FONT_KEY_GOTHIC_18), bounds,
      GTextOverflowModeTrailingEllipsis, GTextAlignmentCenter, NULL);
    return;
  }

  int dev_idx = sorted_device_index(cell_index->row);
  Device *dev = &s_state.devices[dev_idx];
  bool fav = state_is_favorite(dev->name);

  int left_margin = FM_IF_ROUND_LAYOUT(20, 8);
  int text_left = left_margin;
  GSize battery_size = battery_icon_size(dev->battery_percent, list_battery_style(selected));
  GSize charging_size = battery_charging_icon_size(list_battery_style(selected));
  bool show_charging_icon = dev->battery_charging && charging_size.w > 0;
  bool show_battery_icon = battery_icon_known(dev->battery_percent) && battery_size.w > 0;
  int stack_width = show_battery_icon ? battery_size.w : 0;
  if (show_charging_icon) {
    stack_width += charging_size.w + (show_battery_icon ? 2 : 0);
  }
  if (fav && stack_width < 10) {
    stack_width = 10;
  }
  int right_margin = FM_IF_ROUND_LAYOUT(20, 8) + (stack_width > 0 ? stack_width + 8 : 0);

  int stack_x = bounds.size.w - FM_IF_ROUND_LAYOUT(20, 8) - stack_width;

  // Heart icon above battery icon on the right side.
  if (fav) {
    GBitmap *heart = selected ? s_heart_list_white_icon : s_heart_list_icon;
    if (heart) {
      int icon_w = 10;
      int icon_h = 10;
      int icon_x = stack_x + ((stack_width - icon_w) / 2);
      int icon_y = 10;
      graphics_context_set_compositing_mode(ctx, GCompOpSet);
      graphics_draw_bitmap_in_rect(ctx, heart, GRect(icon_x, icon_y, icon_w, icon_h));
    }
  }

  if (show_battery_icon) {
    int content_w = battery_size.w + (show_charging_icon ? (2 + charging_size.w) : 0);
    int content_x = stack_x + ((stack_width - content_w) / 2);
    int battery_x = content_x;
    int battery_y = fav ? 26 : 19;
    battery_icon_draw(ctx, GRect(battery_x, battery_y, battery_size.w, battery_size.h), dev->battery_percent, list_battery_style(selected));
    if (show_charging_icon) {
      int charging_x = battery_x + battery_size.w + 2;
      int charging_y = battery_y + ((battery_size.h - charging_size.h) / 2);
      battery_charging_icon_draw(ctx, GRect(charging_x, charging_y, charging_size.w, charging_size.h), list_battery_style(selected));
    }
  } else if (show_charging_icon) {
    int charging_x = stack_x + ((stack_width - charging_size.w) / 2);
    int charging_y = fav ? 25 : 18;
    battery_charging_icon_draw(ctx, GRect(charging_x, charging_y, charging_size.w, charging_size.h), list_battery_style(selected));
  }

  // Line 1: device name (bold)
  GRect name_rect = GRect(text_left, 2, bounds.size.w - text_left - right_margin, 22);
  graphics_context_set_text_color(ctx, selected ? GColorWhite : GColorBlack);
  graphics_draw_text(ctx, dev->name, fonts_get_system_font(FONT_KEY_GOTHIC_18_BOLD), name_rect,
    GTextOverflowModeTrailingEllipsis, FM_IF_ROUND_LAYOUT(GTextAlignmentCenter, GTextAlignmentLeft), NULL);

  // Line 2: device class
  GRect sub_rect = GRect(text_left, 22, bounds.size.w - text_left - right_margin, 18);
  graphics_context_set_text_color(ctx, list_secondary_text_color(selected));
  char subtitle[80];
  snprintf(
    subtitle,
    sizeof(subtitle),
    "%s | %s",
    dev->device_class[0] ? dev->device_class : "Unknown",
    dev->distance_text[0] ? dev->distance_text : "Distance unknown"
  );
  graphics_draw_text(ctx, subtitle, fonts_get_system_font(FONT_KEY_GOTHIC_14), sub_rect,
    GTextOverflowModeTrailingEllipsis, FM_IF_ROUND_LAYOUT(GTextAlignmentCenter, GTextAlignmentLeft), NULL);
}

static void select_click(struct MenuLayer *menu, MenuIndex *cell_index, void *ctx) {
  if (s_state.device_count == 0) return;
  s_state.selected_index = sorted_device_index(cell_index->row);
  state_save();
  detail_window_push();
}

static void selection_changed(struct MenuLayer *menu, MenuIndex new_index, MenuIndex old_index, void *ctx) {
  if (s_syncing_selection) {
    return;
  }
  s_state.selected_index = sorted_device_index(new_index.row);
  s_has_initialized_highlight = true;
}

// ── Window lifecycle ───────────────────────────────────────────────────────

static void window_load(Window *window) {
  Layer *root = window_get_root_layer(window);
  GRect bounds = layer_get_bounds(root);

  // Heart icon for favorites
  s_heart_list_icon = gbitmap_create_with_resource(RESOURCE_ID_HEART_LIST);
  s_heart_list_white_icon = gbitmap_create_with_resource(RESOURCE_ID_HEART_LIST_WHITE);
  battery_icons_init();

  // Status bar
  s_status_bar = status_bar_layer_create();
  status_bar_layer_set_colors(s_status_bar, GColorWhite, GColorBlack);
  layer_add_child(root, status_bar_layer_get_layer(s_status_bar));

  // Menu layer (below status bar)
  GRect menu_bounds = GRect(0, STATUS_BAR_LAYER_HEIGHT, bounds.size.w, bounds.size.h - STATUS_BAR_LAYER_HEIGHT);
  s_menu = menu_layer_create(menu_bounds);
  menu_layer_set_callbacks(s_menu, NULL, (MenuLayerCallbacks){
    .get_num_rows = get_num_rows,
    .get_cell_height = get_cell_height,
    .draw_row = draw_row,
    .select_click = select_click,
    .selection_changed = selection_changed,
  });

  menu_layer_set_normal_colors(s_menu, GColorWhite, GColorBlack);
  menu_layer_set_highlight_colors(s_menu, list_highlight_color(), GColorWhite);

  menu_layer_set_click_config_onto_window(s_menu, window);
  layer_add_child(root, menu_layer_get_layer(s_menu));

  rebuild_sorted_index();
  if (s_state.device_count > 0) {
    select_top_row(false);
    s_has_initialized_highlight = true;
  }
}

static void window_unload(Window *window) {
  menu_layer_destroy(s_menu);
  status_bar_layer_destroy(s_status_bar);
  if (s_heart_list_icon) gbitmap_destroy(s_heart_list_icon);
  if (s_heart_list_white_icon) gbitmap_destroy(s_heart_list_white_icon);
  s_heart_list_icon = NULL;
  s_heart_list_white_icon = NULL;
  battery_icons_deinit();
}

static void window_appear(Window *window) {
  // Re-sort in case favorites changed in detail view
  rebuild_sorted_index();
  if (s_state.device_count <= 0) {
    s_has_initialized_highlight = false;
  }
  if (s_menu) {
    s_syncing_selection = true;
    menu_layer_reload_data(s_menu);
    s_syncing_selection = false;
    if (!s_has_initialized_highlight && s_state.device_count > 0) {
      select_top_row(false);
      s_has_initialized_highlight = true;
    } else {
      sync_menu_selection(false);
    }
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

void list_window_push(void) {
  if (!s_window) {
    s_window = window_create();
    window_set_window_handlers(s_window, (WindowHandlers){
      .load = window_load,
      .unload = window_unload,
      .appear = window_appear,
    });
  }
  window_stack_push(s_window, true);
}

void list_window_reload(void) {
  rebuild_sorted_index();
  if (s_state.device_count <= 0) {
    s_has_initialized_highlight = false;
  }
  if (s_menu) {
    s_syncing_selection = true;
    menu_layer_reload_data(s_menu);
    s_syncing_selection = false;
    if (!s_has_initialized_highlight && s_state.device_count > 0) {
      select_top_row(false);
      s_has_initialized_highlight = true;
    } else {
      sync_menu_selection(false);
    }
  }
}
