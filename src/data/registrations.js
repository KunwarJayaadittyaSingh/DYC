/*
  ONE place to control registrations.

  registrationLink : paste the form URL to OPEN registrations.
                     Leave null to keep it CLOSED (no popup, website stays normal).
  opensAt  (optional): IST time the link goes live, e.g. '2026-11-01T10:00:00+05:30'.
                     Before this time nothing shows. At this time the popup starts by itself.
  closesAt (optional): IST time registrations close automatically.
  tagline / date (optional): small text shown in the popup.
  showInPopup: false hides an event from the popup.

  The popup shows an event ONLY when:
    registrationLink is set  AND  opensAt has passed (or is empty)  AND  closesAt has not passed.

  To close an event: set its link back to null (or let closesAt do it).
*/
export const REGISTRATIONS = [
  { name: 'Youthvibe', path: '/youthvibe', registrationLink: null, opensAt: '', closesAt: '', tagline: '', date: '' },
  { name: 'Freshmen Talent Search', path: '/fts', registrationLink: null, opensAt: '', closesAt: '', tagline: '', date: '' },
  // To open Magnitude with the form page: registrationLink: '/magnitude/register'
  { name: 'Magnitude', path: '/magnitude', registrationLink: null, opensAt: '', closesAt: '', tagline: 'Music, dance, open mic and more.', date: '' },
  { name: 'Concoction', path: '/concoction', registrationLink: null, opensAt: '', closesAt: '', tagline: '', date: '' },
  { name: 'TEDx', path: '/tedx', registrationLink: null, opensAt: '', closesAt: '', tagline: '', date: '' },
  { name: 'Hult Prize', path: '/hult-prize', registrationLink: null, opensAt: '', closesAt: '', tagline: '', date: '' },
]

/* Popup settings */
export const POPUP = {
  enabled: true, // false = stop the popup completely
  title: 'Registrations',
  delayMs: 1200, // wait before it appears
  repeat: 'session', // 'session' = once per visit, 'always' = every page load
  version: 'v1', // change to 'v2' to show it again to people who already closed it
}

/* Settings for the Magnitude registration form page (only needed if you use that page) */
export const MAGNITUDE_FORM = {
  submitUrl: '', // paste your Google Apps Script URL here
  events: ['Music', 'Dance', 'Open Mic', 'Drama', 'Stand-up Comedy', 'Fashion Show', 'Art & Painting', 'Photography', 'Gaming'],
}
export const FTS_FORM = {
  submitUrl: '', // paste your Google Apps Script URL here
  events: ['Music', 'Dance', 'Open Mic', 'Drama', 'Stand-up Comedy', 'Fashion Show', 'Art & Painting', 'Photography', 'Gaming'],
}

/* ── helpers (no need to edit) ── */
export const getStatus = (ev, now = new Date()) => {
  if (!ev.registrationLink) return 'closed'
  if (ev.closesAt && now >= new Date(ev.closesAt)) return 'closed'
  if (ev.opensAt && now < new Date(ev.opensAt)) return 'upcoming'
  return 'open'
}

// Handy for event pages:  registrationLink={getRegistrationLink('/fts')}
// Returns the link only while registrations are actually open, otherwise null.
export const getRegistrationLink = (path) => {
  const ev = REGISTRATIONS.find((e) => e.path === path)
  return ev && getStatus(ev) === 'open' ? ev.registrationLink : null
}