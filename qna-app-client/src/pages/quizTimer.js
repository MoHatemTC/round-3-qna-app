export function getRemainingMs(endTimeIso, now = Date.now()) {
  return new Date(endTimeIso).getTime() - now;
}

export function hasExpired(endTimeIso, now = Date.now()) {
  return getRemainingMs(endTimeIso, now) <= 0;
}