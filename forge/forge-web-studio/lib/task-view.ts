// Each selection is a new visit, including A -> B -> A. Requests from an older
// visit, session, or snapshot may finish, but cannot change the current view.
export function createTaskView(readSession: () => number) {
  let thread: string | null = null;
  let visit = 0;
  const requests = new Map<string, number>();
  return {
    select(id: string | null) {
      thread = id;
      visit++;
      requests.clear();
    },
    isSelected(id: string) { return thread === id; },
    invalidate(key: string) { requests.set(key, (requests.get(key) || 0) + 1); },
    begin(id: string, key: string) {
      if (thread !== id) return null;
      const selectedVisit = visit, session = readSession();
      const request = (requests.get(key) || 0) + 1;
      requests.set(key, request);
      return () => thread === id && visit === selectedVisit
        && session === readSession() && requests.get(key) === request;
    },
  };
}
