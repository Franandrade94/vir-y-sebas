/** Contenido del .ics del casamiento (recordatorios: 3/oct 00:00 ART y 1 día antes). */

export const WEDDING_ICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Vir y Seba//Web//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:casamiento-vir-seba-2026-10-03@viryseba-web
DTSTAMP:20260507T150000Z
DTSTART;TZID=America/Argentina/Buenos_Aires:20261003T180000
DTEND;TZID=America/Argentina/Buenos_Aires:20261003T230000
SUMMARY:Casamiento Vir y Seba
LOCATION:La Herencia\\, Saravi 1799\\, La Lonja\\, Pilar\\, Buenos Aires
DESCRIPTION:Vir y Seba — 3 de octubre de 2026\\, 18:00 hs. La Herencia\\, La Lonja\\, Pilar.
BEGIN:VALARM
TRIGGER;VALUE=DATE-TIME:20261003T030000Z
ACTION:DISPLAY
DESCRIPTION:Hoy es el casamiento de Vir y Seba (18:00 hs)
END:VALARM
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Mañana es el casamiento de Vir y Seba (18:00 hs)
END:VALARM
END:VEVENT
END:VCALENDAR
`;
