/** Enlaces del evento (web + emails RSVP) */

export const GCAL_DATES_UTC = "20261003T210000Z/20261004T020000Z";

export const VENUE_MAPS_URL =
  "https://www.google.com/maps/place/La+Herencia+Eventos/@-34.4491502,-58.8428629,17z/data=!4m6!3m5!1s0x95bc9c181d17a319:0x90573af4ed1ba01e!8m2!3d-34.4491547!4d-58.840288!16s%2Fg%2F11cknj_lfg?entry=ttu";

export const MICRO_MAPS_URL = "https://maps.app.goo.gl/uoWmJF3LGLkemYuB8";

export const HOTEL_WEB_URL = "https://www.kospilarhotel.com";
export const HOTEL_MAPS_URL = "https://maps.app.goo.gl/aLTjwwppuJt8YtNq5";
export const HOTEL_DISCOUNT_CODE = "BodaVir&Sebas";

export const VENUE_NAME = "La Herencia";
export const VENUE_ADDRESS = "Saravi 1799, La Lonja, Pilar, Buenos Aires";

export const CALENDAR_ICS_PATH = "/calendar/casamiento-vir-seba-2026.ics";

/** @deprecated alias */
export const APPLE_CALENDAR_ICS_PATH = CALENDAR_ICS_PATH;

/** ICS con recordatorios (00:00 del 3/oct y 1 día antes). Misma URL para Google/Android e iPhone. */
export function getCalendarIcsUrl(siteUrl) {
  const base = (siteUrl || "").replace(/\/$/, "");
  return base ? `${base}${CALENDAR_ICS_PATH}` : CALENDAR_ICS_PATH;
}

export function getGoogleCalendarUrl(siteUrl) {
  return getCalendarIcsUrl(siteUrl);
}

export function getAppleCalendarUrl(siteUrl) {
  return getCalendarIcsUrl(siteUrl);
}
