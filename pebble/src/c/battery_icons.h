#pragma once

#include <pebble.h>

typedef enum {
  BATTERY_ICON_STYLE_DARK = 0,
  BATTERY_ICON_STYLE_LIGHT = 1,
} BatteryIconStyle;

void battery_icons_init(void);
void battery_icons_deinit(void);
int battery_icon_percent_from_text(const char *text);
bool battery_icon_is_charging_from_text(const char *text);
bool battery_icon_known(int percent);
GSize battery_icon_size(int percent, BatteryIconStyle style);
void battery_icon_draw(GContext *ctx, GRect rect, int percent, BatteryIconStyle style);
GSize battery_charging_icon_size(BatteryIconStyle style);
void battery_charging_icon_draw(GContext *ctx, GRect rect, BatteryIconStyle style);
