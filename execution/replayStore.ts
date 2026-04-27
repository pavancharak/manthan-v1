const usedEvents = new Set<string>();

export function checkReplay(event_id: string) {
  if (usedEvents.has(event_id)) {
    throw new Error("Replay detected: event already processed");
  }
}

export function markEventUsed(event_id: string) {
  usedEvents.add(event_id);
}