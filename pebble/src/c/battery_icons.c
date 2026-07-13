#include "battery_icons.h"

typedef struct {
  int threshold;
  uint32_t dark_resource_id;
  uint32_t light_resource_id;
} BatteryIconResource;

static const BatteryIconResource s_battery_resources[] = {
  { 5, RESOURCE_ID_BATTERY_DARK_05_PERCENT, RESOURCE_ID_BATTERY_LIGHT_05_PERCENT },
  { 10, RESOURCE_ID_BATTERY_DARK_10_PERCENT, RESOURCE_ID_BATTERY_LIGHT_10_PERCENT },
  { 20, RESOURCE_ID_BATTERY_DARK_20_PERCENT, RESOURCE_ID_BATTERY_LIGHT_20_PERCENT },
  { 30, RESOURCE_ID_BATTERY_DARK_30_PERCENT, RESOURCE_ID_BATTERY_LIGHT_30_PERCENT },
  { 40, RESOURCE_ID_BATTERY_DARK_40_PERCENT, RESOURCE_ID_BATTERY_LIGHT_40_PERCENT },
  { 50, RESOURCE_ID_BATTERY_DARK_50_PERCENT, RESOURCE_ID_BATTERY_LIGHT_50_PERCENT },
  { 60, RESOURCE_ID_BATTERY_DARK_60_PERCENT, RESOURCE_ID_BATTERY_LIGHT_60_PERCENT },
  { 70, RESOURCE_ID_BATTERY_DARK_70_PERCENT, RESOURCE_ID_BATTERY_LIGHT_70_PERCENT },
  { 80, RESOURCE_ID_BATTERY_DARK_80_PERCENT, RESOURCE_ID_BATTERY_LIGHT_80_PERCENT },
  { 90, RESOURCE_ID_BATTERY_DARK_90_PERCENT, RESOURCE_ID_BATTERY_LIGHT_90_PERCENT },
  { 100, RESOURCE_ID_BATTERY_DARK_100_PERCENT, RESOURCE_ID_BATTERY_LIGHT_100_PERCENT },
};

static GBitmap *s_dark_icons[ARRAY_LENGTH(s_battery_resources)];
static GBitmap *s_light_icons[ARRAY_LENGTH(s_battery_resources)];
static GBitmap *s_dark_charging_icon;
static GBitmap *s_light_charging_icon;
static int s_init_count;

static void load_icon_variant(GBitmap **target, bool light_style) {
  for (int i = 0; i < (int)ARRAY_LENGTH(s_battery_resources); i++) {
    target[i] = gbitmap_create_with_resource(
      light_style ? s_battery_resources[i].light_resource_id : s_battery_resources[i].dark_resource_id
    );
  }
}

static void destroy_icon_variant(GBitmap **target) {
  for (int i = 0; i < (int)ARRAY_LENGTH(s_battery_resources); i++) {
    if (target[i]) {
      gbitmap_destroy(target[i]);
      target[i] = NULL;
    }
  }
}

static int bucket_index_for_percent(int percent) {
  if (percent < 0) {
    return -1;
  }

  if (percent <= 7) {
    return 0;
  }

  if (percent >= 95) {
    return (int)ARRAY_LENGTH(s_battery_resources) - 1;
  }

  int rounded = ((percent + 5) / 10) * 10;
  for (int i = 0; i < (int)ARRAY_LENGTH(s_battery_resources); i++) {
    if (s_battery_resources[i].threshold == rounded) {
      return i;
    }
  }

  return (int)ARRAY_LENGTH(s_battery_resources) - 1;
}

static GBitmap *bitmap_for_percent(int percent, BatteryIconStyle style) {
  int index = bucket_index_for_percent(percent);
  if (index < 0) {
    return NULL;
  }
  return style == BATTERY_ICON_STYLE_LIGHT ? s_light_icons[index] : s_dark_icons[index];
}

void battery_icons_init(void) {
  s_init_count++;
  if (s_init_count > 1) {
    return;
  }

  load_icon_variant(s_dark_icons, false);
  load_icon_variant(s_light_icons, true);
  s_dark_charging_icon = gbitmap_create_with_resource(RESOURCE_ID_BATTERY_DARK_CHARGING_ICON);
  s_light_charging_icon = gbitmap_create_with_resource(RESOURCE_ID_BATTERY_LIGHT_CHARGING_ICON);
}

void battery_icons_deinit(void) {
  if (s_init_count == 0) {
    return;
  }

  s_init_count--;
  if (s_init_count > 0) {
    return;
  }

  destroy_icon_variant(s_dark_icons);
  destroy_icon_variant(s_light_icons);
  if (s_dark_charging_icon) {
    gbitmap_destroy(s_dark_charging_icon);
    s_dark_charging_icon = NULL;
  }
  if (s_light_charging_icon) {
    gbitmap_destroy(s_light_charging_icon);
    s_light_charging_icon = NULL;
  }
}

int battery_icon_percent_from_text(const char *text) {
  if (!text) {
    return -1;
  }

  const char *cursor = text;
  while (*cursor) {
    if (*cursor < '0' || *cursor > '9') {
      cursor++;
      continue;
    }

    int value = 0;
    bool saw_digit = false;
    while (*cursor >= '0' && *cursor <= '9') {
      saw_digit = true;
      value = (value * 10) + (*cursor - '0');
      cursor++;
      if (value > 100) {
        break;
      }
    }
    if (saw_digit && value >= 0 && value <= 100) {
      return value;
    }
  }

  return -1;
}

bool battery_icon_is_charging_from_text(const char *text) {
  if (!text) {
    return false;
  }

  for (const char *cursor = text; *cursor; cursor++) {
    if ((*cursor == 'c' || *cursor == 'C')
      && strncmp(cursor, "charging", 8) == 0) {
      return true;
    }
  }

  return false;
}

bool battery_icon_known(int percent) {
  return bucket_index_for_percent(percent) >= 0;
}

GSize battery_icon_size(int percent, BatteryIconStyle style) {
  GBitmap *bitmap = bitmap_for_percent(percent, style);
  if (!bitmap) {
    return GSize(0, 0);
  }

  return gbitmap_get_bounds(bitmap).size;
}

void battery_icon_draw(GContext *ctx, GRect rect, int percent, BatteryIconStyle style) {
  GBitmap *bitmap = bitmap_for_percent(percent, style);
  if (!bitmap) {
    return;
  }

  graphics_context_set_compositing_mode(ctx, GCompOpSet);
  graphics_draw_bitmap_in_rect(ctx, bitmap, rect);
}

GSize battery_charging_icon_size(BatteryIconStyle style) {
  GBitmap *bitmap = style == BATTERY_ICON_STYLE_LIGHT ? s_light_charging_icon : s_dark_charging_icon;
  if (!bitmap) {
    return GSize(0, 0);
  }

  return gbitmap_get_bounds(bitmap).size;
}

void battery_charging_icon_draw(GContext *ctx, GRect rect, BatteryIconStyle style) {
  GBitmap *bitmap = style == BATTERY_ICON_STYLE_LIGHT ? s_light_charging_icon : s_dark_charging_icon;
  if (!bitmap) {
    return;
  }

  graphics_context_set_compositing_mode(ctx, GCompOpSet);
  graphics_draw_bitmap_in_rect(ctx, bitmap, rect);
}
