#pragma once

#if defined(PBL_PLATFORM_GABBRO)
#define FM_IS_GABBRO 1
#else
#define FM_IS_GABBRO 0
#endif

#if defined(PBL_ROUND)
#define FM_USE_ROUND_LAYOUT 1
#else
#define FM_USE_ROUND_LAYOUT 0
#endif

#define FM_IF_ROUND_LAYOUT(round_value, square_value) \
  ((FM_USE_ROUND_LAYOUT) ? (round_value) : (square_value))

#define FM_IF_GABBRO(gabbro_value, other_value) \
  ((FM_IS_GABBRO) ? (gabbro_value) : (other_value))
