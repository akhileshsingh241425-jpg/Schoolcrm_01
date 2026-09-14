// Student and parent /fees responses use different key names for the same
// summary numbers (student: nested under `summary`, parent: flat). Normalize
// both into one shape so a single component can render either.
export function normalizeFees(feesData) {
  if (!feesData) return { total: 0, paid: 0, pending: 0, overdue_count: 0 };
  if (feesData.summary) {
    return feesData.summary;
  }
  return {
    total: feesData.total_fee ?? 0,
    paid: feesData.total_paid ?? 0,
    pending: feesData.total_pending ?? 0,
    overdue_count: feesData.overdue_count ?? 0,
  };
}
