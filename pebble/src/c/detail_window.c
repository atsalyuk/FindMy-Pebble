#include <pebble.h>
#include "detail_window.h"
#include "state.h"
#include "battery_icons.h"
#include "layout.h"
#include "protocol.h"

static Window *s_window;
static Layer *s_canvas;
static ActionBarLayer *s_action_bar;
static GBitmap *s_ping_icon;
// s_mute_icon removed — Apple has no stop-sound API
static GBitmap *s_heart_filled;
static GBitmap *s_heart_empty;
static GDrawCommandImage *s_device_icon;
static GDrawCommandSequence *s_device_anim;
static AppTimer *s_anim_timer;
static int s_anim_frame;
static AppTimer *s_result_timer;
static AppTimer *s_enable_ping_timer;
static bool s_ping_clicks_enabled;
static bool s_ping_animation_active;
static GRect s_window_bounds;

// ── Resource helpers ───────────────────────────────────────────────────────

static uint32_t device_icon_resource(const char *device_class) {
  if (strcmp(device_class, "iPhone") == 0) return RESOURCE_ID_IPHONE_ICON;
  if (strcmp(device_class, "iPad") == 0) return RESOURCE_ID_IPAD_ICON;
  if (strcmp(device_class, "Mac") == 0 || strcmp(device_class, "MacBook") == 0) return RESOURCE_ID_MACBOOK_ICON;
  return RESOURCE_ID_IPHONE_ICON;
}

static uint32_t device_anim_resource(const char *device_class) {
  if (strcmp(device_class, "iPhone") == 0) return RESOURCE_ID_IPHONE_ANIM;
  if (strcmp(device_class, "iPad") == 0) return RESOURCE_ID_IPAD_ANIM;
  if (strcmp(device_class, "Mac") == 0 || strcmp(device_class, "MacBook") == 0) return RESOURCE_ID_MACBOOK_ANIM;
  return RESOURCE_ID_IPHONE_ANIM;
}

static GColor detail_background_color(void) {
#ifdef PBL_BW
  return GColorWhite;
#else
  return GColorFromRGB(85, 136, 102);
#endif
}

static GColor detail_text_color(void) {
#ifdef PBL_BW
  return GColorBlack;
#else
  return GColorWhite;
#endif
}

static GRect detail_content_frame(GRect bounds) {
  GRect frame = GRect(0, 0, bounds.size.w - ACTION_BAR_WIDTH, bounds.size.h);
#if FM_USE_ROUND_LAYOUT
  frame.origin.x = 8;
  frame.origin.y = 12;
  frame.size.w -= 18;
  frame.size.h -= 24;
#endif
  return frame;
}

static BatteryIconStyle detail_battery_style(void) {
#ifdef PBL_BW
  return BATTERY_ICON_STYLE_DARK;
#else
  return BATTERY_ICON_STYLE_LIGHT;
#endif
}

static int detail_metric_top(void) {
#if FM_USE_ROUND_LAYOUT
  return FM_IF_GABBRO(4, 0);
#else
  return 8;
#endif
}

static int detail_metric_side_padding(int width) {
#if FM_USE_ROUND_LAYOUT
  (void)width;
  return 8;
#else
  if (width <= 120) {
    return 4;
  }
  if (width <= 144) {
    return 6;
  }
  if (width <= 176) {
    return 8;
  }
  return 10;
#endif
}

static int detail_round_right_padding(void) {
#if FM_USE_ROUND_LAYOUT
  return 10;
#else
  return 0;
#endif
}

static int detail_round_metric_shift(void) {
#if FM_USE_ROUND_LAYOUT
  return 10;
#else
  return 0;
#endif
}

static int detail_round_static_icon_shift(const char *device_class) {
#if FM_USE_ROUND_LAYOUT
  if (FM_IS_GABBRO) {
    (void)device_class;
    return 0;
  }
  if (device_class && strcmp(device_class, "iPhone") == 0) {
    return 24;
  }
  return 14;
#else
  (void)device_class;
  return 0;
#endif
}

static int detail_round_animated_icon_shift(const char *device_class) {
#if FM_USE_ROUND_LAYOUT
  if (FM_IS_GABBRO) {
    (void)device_class;
    return 0;
  }
  if (device_class && strcmp(device_class, "iPhone") == 0) {
    return 14;
  }
  return 9;
#else
  (void)device_class;
  return 0;
#endif
}

static int detail_battery_icon_text_offset(void) {
#if FM_USE_ROUND_LAYOUT
  return 2;
#else
  return 2;
#endif
}

static int detail_text_margin(void) {
#if FM_USE_ROUND_LAYOUT
  return FM_IF_GABBRO(12, 4);
#else
  return 6;
#endif
}

static int detail_round_content_center_x(Layer *layer, GRect bounds, GSize icon_size) {
  if (FM_IS_GABBRO) {
    GRect frame = layer_get_frame(layer);
    return (s_window_bounds.size.w / 2) - frame.origin.x;
  }
  return bounds.size.w - detail_round_right_padding() - (icon_size.w / 2);
}

static GRect detail_round_centered_rect(int center_x, int width, int y, int height, int min_x, int max_x) {
  int x = center_x - (width / 2);
  if (x < min_x) {
    x = min_x;
  }
  if (x + width > max_x) {
    x = max_x - width;
  }
  if (x < min_x) {
    x = min_x;
  }
  return GRect(x, y, width, height);
}

static int detail_round_name_width(int text_w, GSize icon_size) {
  int round_name_w = icon_size.w + FM_IF_GABBRO(36, 18);
  int min_name_w = FM_IF_GABBRO(112, 96);
  int max_name_w = text_w - FM_IF_GABBRO(8, 0);
  if (round_name_w < min_name_w) {
    round_name_w = min_name_w;
  }
  if (max_name_w < 0) {
    max_name_w = text_w;
  }
  if (round_name_w > max_name_w) {
    round_name_w = max_name_w;
  }
  return round_name_w;
}

static GTextAlignment detail_round_text_alignment(void) {
  return FM_IF_GABBRO(GTextAlignmentCenter, GTextAlignmentRight);
}

static int detail_round_distance_top(void) {
  return detail_metric_top() + FM_IF_GABBRO(20, 14);
}

static int detail_round_metrics_bottom(int distance_bottom) {
  return distance_bottom + FM_IF_GABBRO(8, 2);
}

static int detail_round_content_top_gap(void) {
  return FM_IF_GABBRO(6, 0);
}

static int detail_round_name_gap(void) {
  return FM_IF_GABBRO(8, 0);
}

static int detail_status_gap(void) {
  return FM_IF_GABBRO(6, 4);
}

// ── Animation ──────────────────────────────────────────────────────────────

static void anim_timer_callback(void *data) {
  s_anim_frame = (s_anim_frame + 1) % 8;
  layer_mark_dirty(s_canvas);
  if (s_state.busy) {
    s_anim_timer = app_timer_register(60, anim_timer_callback, NULL);
  }
}

static void start_animation(void) {
  s_anim_frame = 0;
  s_ping_animation_active = true;
  s_anim_timer = app_timer_register(60, anim_timer_callback, NULL);
}

static void stop_animation(void) {
  if (s_anim_timer) {
    app_timer_cancel(s_anim_timer);
    s_anim_timer = NULL;
  }
  s_ping_animation_active = false;
}

static void enable_ping_clicks_callback(void *data) {
  s_enable_ping_timer = NULL;
  s_ping_clicks_enabled = true;
}

// ── Drawing ────────────────────────────────────────────────────────────────

static void canvas_update(Layer *layer, GContext *ctx) {
  GRect bounds = layer_get_bounds(layer);
  if (s_state.selected_index >= s_state.device_count || s_state.device_count == 0) return;
  Device *dev = &s_state.devices[s_state.selected_index];

  // Use a monochrome-friendly background on b/w devices.
  graphics_context_set_fill_color(ctx, detail_background_color());
  graphics_fill_rect(ctx, bounds, 0, GCornerNone);

  graphics_context_set_text_color(ctx, detail_text_color());

  GSize icon_size = GSize(0, 0);
  if (s_ping_animation_active && s_device_anim) {
    icon_size = gdraw_command_sequence_get_bounds_size(s_device_anim);
  } else if (s_device_icon) {
    icon_size = gdraw_command_image_get_bounds_size(s_device_icon);
  }

  int text_margin = detail_text_margin();
  int text_w = bounds.size.w - text_margin * 2;

#if FM_USE_ROUND_LAYOUT
  int round_name_w = detail_round_name_width(text_w, icon_size);
  int round_content_center_x = detail_round_content_center_x(layer, bounds, icon_size);
#endif

  int metrics_bottom = 0;
#if FM_USE_ROUND_LAYOUT
  {
    bool show_battery = battery_icon_known(dev->battery_percent);
    GSize battery_size = battery_icon_size(dev->battery_percent, detail_battery_style());
    GSize charging_size = battery_charging_icon_size(detail_battery_style());
    bool show_charging = dev->battery_charging && charging_size.w > 0;
    GRect battery_metric_box = FM_IF_GABBRO(
      detail_round_centered_rect(round_content_center_x, bounds.size.w - 24, detail_metric_top(), 18, 0, bounds.size.w),
      GRect(8, detail_metric_top(), bounds.size.w - 16, 18)
    );
    char battery_label[12];
    battery_label[0] = '\0';
    GSize battery_label_size = GSize(0, 0);
    if (show_battery && battery_size.w > 0) {
      snprintf(battery_label, sizeof(battery_label), "%d%%", dev->battery_percent);
      battery_label_size = graphics_text_layout_get_content_size(
        battery_label,
        fonts_get_system_font(FONT_KEY_GOTHIC_14),
        battery_metric_box,
        GTextOverflowModeTrailingEllipsis,
        GTextAlignmentLeft
      );
    }

    int battery_group_w = battery_label_size.w;
    if ((show_battery && battery_size.w > 0) || show_charging) {
      battery_group_w += (battery_label_size.w > 0 ? 4 : 0) + (show_battery ? battery_size.w : 0);
    }
    if (show_charging) {
      battery_group_w += charging_size.w + (show_battery ? 2 : 0);
    }
    if ((show_battery && battery_size.w > 0) || show_charging) {
      int battery_group_x = FM_IF_GABBRO(
        round_content_center_x - (battery_group_w / 2),
        bounds.size.w - 16 - battery_group_w + detail_round_metric_shift()
      );
      if (battery_group_x < 0) {
        battery_group_x = 0;
      }
      if (battery_group_x + battery_group_w > bounds.size.w) {
        battery_group_x = bounds.size.w - battery_group_w;
      }
      GRect battery_label_rect = GRect(battery_group_x, detail_metric_top(), battery_label_size.w, 16);
      if (battery_label_size.w > 0) {
        graphics_draw_text(ctx, battery_label, fonts_get_system_font(FONT_KEY_GOTHIC_14), battery_label_rect,
          GTextOverflowModeTrailingEllipsis, GTextAlignmentLeft, NULL);
      }
      int battery_x = battery_group_x + battery_label_size.w + (battery_label_size.w > 0 ? 4 : 0);
      if (show_battery && battery_size.w > 0) {
        int battery_y = battery_label_rect.origin.y + ((battery_label_rect.size.h - battery_size.h) / 2) + detail_battery_icon_text_offset();
        battery_icon_draw(ctx, GRect(battery_x, battery_y, battery_size.w, battery_size.h), dev->battery_percent, detail_battery_style());
        if (show_charging) {
          int charging_x = battery_x + battery_size.w + 2;
          int charging_y = battery_label_rect.origin.y + ((battery_label_rect.size.h - charging_size.h) / 2) + detail_battery_icon_text_offset();
          battery_charging_icon_draw(ctx, GRect(charging_x, charging_y, charging_size.w, charging_size.h), detail_battery_style());
        }
      } else if (show_charging) {
        int charging_y = battery_label_rect.origin.y + ((battery_label_rect.size.h - charging_size.h) / 2) + detail_battery_icon_text_offset();
        battery_charging_icon_draw(ctx, GRect(battery_x, charging_y, charging_size.w, charging_size.h), detail_battery_style());
      }
    }

    GRect distance_rect = FM_IF_GABBRO(
      detail_round_centered_rect(round_content_center_x, bounds.size.w - 24, detail_round_distance_top(), 18, 0, bounds.size.w),
      GRect(16 + detail_round_metric_shift(), detail_round_distance_top(), bounds.size.w - 32, 18)
    );
    graphics_draw_text(ctx, dev->distance_text[0] ? dev->distance_text : "Distance unknown",
      fonts_get_system_font(FONT_KEY_GOTHIC_14), distance_rect,
      GTextOverflowModeTrailingEllipsis, FM_IF_GABBRO(GTextAlignmentCenter, GTextAlignmentRight), NULL);
    metrics_bottom = detail_round_metrics_bottom(distance_rect.origin.y + distance_rect.size.h);
  }
#else
  {
    int side_padding = detail_metric_side_padding(bounds.size.w);
    GRect distance_rect = GRect(side_padding, detail_metric_top(), (bounds.size.w / 2) - side_padding, 18);
    graphics_draw_text(ctx, dev->distance_text[0] ? dev->distance_text : "Distance unknown",
      fonts_get_system_font(FONT_KEY_GOTHIC_14), distance_rect,
      GTextOverflowModeTrailingEllipsis, GTextAlignmentLeft, NULL);

    GSize battery_size = battery_icon_size(dev->battery_percent, detail_battery_style());
    GSize charging_size = battery_charging_icon_size(detail_battery_style());
    bool show_battery = battery_icon_known(dev->battery_percent) && battery_size.w > 0;
    bool show_charging = dev->battery_charging && charging_size.w > 0;
    if (show_battery || show_charging) {
      char battery_label[12];
      battery_label[0] = '\0';
      GSize battery_label_size = GSize(0, 0);
      if (show_battery) {
        snprintf(battery_label, sizeof(battery_label), "%d%%", dev->battery_percent);
        battery_label_size = graphics_text_layout_get_content_size(
          battery_label,
          fonts_get_system_font(FONT_KEY_GOTHIC_14),
          GRect(0, 0, bounds.size.w - (side_padding * 2), 18),
          GTextOverflowModeTrailingEllipsis,
          GTextAlignmentRight
        );
      }
      int group_w = battery_label_size.w;
      if (show_battery || show_charging) {
        group_w += (battery_label_size.w > 0 ? 4 : 0) + (show_battery ? battery_size.w : 0);
      }
      if (show_charging) {
        group_w += charging_size.w + (show_battery ? 2 : 0);
      }
      int group_x = bounds.size.w - side_padding - group_w;
      GRect battery_label_rect = GRect(group_x, detail_metric_top(), battery_label_size.w, 18);
      if (battery_label_size.w > 0) {
        graphics_draw_text(ctx, battery_label, fonts_get_system_font(FONT_KEY_GOTHIC_14), battery_label_rect,
          GTextOverflowModeTrailingEllipsis, GTextAlignmentLeft, NULL);
      }
      int battery_x = group_x + battery_label_size.w + (battery_label_size.w > 0 ? 4 : 0);
      if (show_battery) {
        int battery_y = battery_label_rect.origin.y + ((battery_label_rect.size.h - battery_size.h) / 2) + detail_battery_icon_text_offset();
        battery_icon_draw(ctx, GRect(battery_x, battery_y, battery_size.w, battery_size.h), dev->battery_percent, detail_battery_style());
        if (show_charging) {
          int charging_x = battery_x + battery_size.w + 2;
          int charging_y = battery_label_rect.origin.y + ((battery_label_rect.size.h - charging_size.h) / 2) + detail_battery_icon_text_offset();
          battery_charging_icon_draw(ctx, GRect(charging_x, charging_y, charging_size.w, charging_size.h), detail_battery_style());
        }
      } else if (show_charging) {
        int charging_y = battery_label_rect.origin.y + ((battery_label_rect.size.h - charging_size.h) / 2) + detail_battery_icon_text_offset();
        battery_charging_icon_draw(ctx, GRect(battery_x, charging_y, charging_size.w, charging_size.h), detail_battery_style());
      }
    }
    metrics_bottom = detail_metric_top() + 20;
  }
#endif

  bool show_status = s_ping_animation_active || !s_state.synced;
  int name_block_h = 44 + (show_status ? detail_status_gap() + 18 : 0);
  int total_h = icon_size.h + 12 + name_block_h;
  int start_y = metrics_bottom + FM_IF_ROUND_LAYOUT(detail_round_content_top_gap(), 6);
  int available_h = bounds.size.h - start_y;
  if (available_h > total_h) {
    start_y += (available_h - total_h) / 2;
  }

  int icon_x =
#if FM_USE_ROUND_LAYOUT
    round_content_center_x - (icon_size.w / 2);
#else
    (bounds.size.w - icon_size.w) / 2;
#endif
  int icon_y = start_y;

  if (s_ping_animation_active && s_device_anim) {
    GDrawCommandFrame *frame = gdraw_command_sequence_get_frame_by_index(s_device_anim, s_anim_frame % 8);
    if (frame) {
      gdraw_command_frame_draw(ctx, s_device_anim, frame, GPoint(icon_x + detail_round_animated_icon_shift(dev->device_class), icon_y));
    }
  } else if (s_device_icon) {
    gdraw_command_image_draw(ctx, s_device_icon, GPoint(icon_x + detail_round_static_icon_shift(dev->device_class), icon_y));
  }

  // Device name — bold, centered below icon, allows word wrap
  int name_y = icon_y + icon_size.h + FM_IF_ROUND_LAYOUT(detail_round_name_gap(), 12);
#if FM_USE_ROUND_LAYOUT
  int round_name_x = round_content_center_x - (round_name_w / 2);
  GRect name_rect = GRect(round_name_x, name_y, round_name_w, 44);
#else
  GRect name_rect = GRect(text_margin, name_y, text_w, 44);
#endif
  GTextAlignment align = FM_IF_ROUND_LAYOUT(detail_round_text_alignment(), GTextAlignmentCenter);
  graphics_draw_text(ctx, dev->name, fonts_get_system_font(FONT_KEY_GOTHIC_18_BOLD), name_rect,
    GTextOverflowModeWordWrap, align, NULL);

  // Measure actual name height to position status below it
  GSize name_size = graphics_text_layout_get_content_size(dev->name,
    fonts_get_system_font(FONT_KEY_GOTHIC_18_BOLD), name_rect,
    GTextOverflowModeWordWrap, align);

  // Status — pinging, or loading while the cached list awaits a fresh sync
  if (show_status) {
#if FM_USE_ROUND_LAYOUT
    GRect status_rect = GRect(round_name_x, name_y + name_size.h + detail_status_gap(), round_name_w, 18);
#else
    GRect status_rect = GRect(text_margin, name_y + name_size.h + detail_status_gap(), text_w, 18);
#endif
    graphics_draw_text(ctx, s_ping_animation_active ? "Pinging..." : "Loading...",
      fonts_get_system_font(FONT_KEY_GOTHIC_14), status_rect,
      GTextOverflowModeTrailingEllipsis, align, NULL);
  }
}

// ── Action bar clicks ──────────────────────────────────────────────────────

static void update_action_bar_icons(void) {
  if (!s_action_bar) return;
  if (s_state.selected_index >= s_state.device_count || s_state.device_count == 0) return;
  Device *dev = &s_state.devices[s_state.selected_index];

  // Ping appears only after a fresh sync — cached devices can't be pinged
  // until PKJS answers. (No mute icon: Apple has no stop-sound API.)
  if (s_state.synced) {
    action_bar_layer_set_icon(s_action_bar, BUTTON_ID_UP, s_ping_icon);
  } else {
    action_bar_layer_clear_icon(s_action_bar, BUTTON_ID_UP);
  }
  action_bar_layer_set_icon(s_action_bar, BUTTON_ID_DOWN,
    state_is_favorite(dev->name) ? s_heart_filled : s_heart_empty);
}

static void up_click(ClickRecognizerRef recognizer, void *context) {
  // Ping — unavailable until a fresh sync replaces the cached device list
  if (!s_ping_clicks_enabled || s_state.busy || s_state.device_count == 0 || !s_state.synced) return;
  extern void app_request_ping(void);
  app_request_ping();
  start_animation();
  update_action_bar_icons();
  layer_mark_dirty(s_canvas);
}

static void down_click(ClickRecognizerRef recognizer, void *context) {
  // Toggle favorite
  if (s_state.busy || s_state.device_count == 0) return;
  Device *dev = &s_state.devices[s_state.selected_index];
  state_toggle_favorite(dev->name);
  update_action_bar_icons();
  layer_mark_dirty(s_canvas);
}

static void select_click(ClickRecognizerRef recognizer, void *context) {
  // Same as up — ping
  up_click(recognizer, context);
}

static void click_config(void *context) {
  window_single_click_subscribe(BUTTON_ID_UP, up_click);
  window_single_click_subscribe(BUTTON_ID_SELECT, select_click);
  window_single_click_subscribe(BUTTON_ID_DOWN, down_click);
}

// ── Window lifecycle ───────────────────────────────────────────────────────

static void window_load(Window *window) {
  Layer *root = window_get_root_layer(window);
  GRect bounds = layer_get_bounds(root);
  Device *dev = &s_state.devices[s_state.selected_index];
  s_window_bounds = bounds;

  // Match the canvas background so no gaps show through during transitions.
  window_set_background_color(window, detail_background_color());

  // Action bar
  s_action_bar = action_bar_layer_create();
  action_bar_layer_set_background_color(s_action_bar, GColorBlack);
  action_bar_layer_set_click_config_provider(s_action_bar, click_config);
  action_bar_layer_add_to_window(s_action_bar, window);

  // Load action bar icons
  s_ping_icon = gbitmap_create_with_resource(RESOURCE_ID_PING_ICON);
  // mute icon not loaded — Apple has no stop-sound API
  s_heart_filled = gbitmap_create_with_resource(RESOURCE_ID_HEART_FILLED);
  s_heart_empty = gbitmap_create_with_resource(RESOURCE_ID_HEART_EMPTY);
  battery_icons_init();
  update_action_bar_icons();

  // Load device PDC
  s_device_icon = gdraw_command_image_create_with_resource(device_icon_resource(dev->device_class));
  s_device_anim = gdraw_command_sequence_create_with_resource(device_anim_resource(dev->device_class));

  // Canvas layer uses the safe content frame left of Pebble's built-in action bar.
  s_canvas = layer_create(detail_content_frame(bounds));
  layer_set_update_proc(s_canvas, canvas_update);
  layer_add_child(root, s_canvas);
}

static void window_unload(Window *window) {
  stop_animation();
  if (s_result_timer) app_timer_cancel(s_result_timer);
  if (s_enable_ping_timer) app_timer_cancel(s_enable_ping_timer);

  layer_destroy(s_canvas);
  action_bar_layer_destroy(s_action_bar);
  gbitmap_destroy(s_ping_icon);
  // mute icon not used
  gbitmap_destroy(s_heart_filled);
  gbitmap_destroy(s_heart_empty);
  battery_icons_deinit();
  if (s_device_icon) gdraw_command_image_destroy(s_device_icon);
  if (s_device_anim) gdraw_command_sequence_destroy(s_device_anim);

  s_action_bar = NULL;
  s_canvas = NULL;
  s_device_icon = NULL;
  s_device_anim = NULL;
}

static void window_appear(Window *window) {
  s_ping_clicks_enabled = false;
  if (s_enable_ping_timer) {
    app_timer_cancel(s_enable_ping_timer);
  }
  s_enable_ping_timer = app_timer_register(200, enable_ping_clicks_callback, NULL);

  // Refresh icons in case favorite changed
  if (!s_state.busy) {
    stop_animation();
  }
  update_action_bar_icons();
  layer_mark_dirty(s_canvas);
}

// ── Public API ─────────────────────────────────────────────────────────────

void detail_window_refresh(void) {
  if (s_action_bar) update_action_bar_icons();
  if (s_canvas) layer_mark_dirty(s_canvas);
  if (!s_state.busy) stop_animation();
}

void detail_window_push(void) {
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
