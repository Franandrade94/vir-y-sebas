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

export function getGoogleCalendarUrl() {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: "Casamiento Vir y Seba",
    dates: GCAL_DATES_UTC,
    details: "Vir y Seba — La Herencia, La Lonja, Pilar.",
    location: `${VENUE_NAME}, ${VENUE_ADDRESS}`,
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

export const APPLE_CALENDAR_ICS_PATH = "/calendar/casamiento-vir-seba-2026.ics";

export function getAppleCalendarUrl(siteUrl) {
  const base = (siteUrl || "").replace(/\/$/, "");
  return `${base}${APPLE_CALENDAR_ICS_PATH}`;
}
