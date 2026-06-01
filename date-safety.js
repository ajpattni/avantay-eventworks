(function () {
  const storageKey = "venue-mini-crm-events";
  const dateFields = ["eventDate", "depositReceivedDate", "balanceDueDate", "balanceReceivedDate"];

  function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function normaliseDate(value) {
    if (value === undefined || value === null || value === "") return "";
    if (typeof value === "number" && Number.isFinite(value)) {
      return dateKey(new Date(Math.round((value - 25569) * 86400 * 1000)));
    }
    const text = value.toString().trim();
    if (!text || /^(tbc|unknown|na|n\/a)$/i.test(text)) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      const parsed = new Date(`${text}T00:00:00`);
      return Number.isNaN(parsed.getTime()) ? "" : text;
    }
    const match = text.match(/^(\d{1,2})[\/. -](\d{1,2})[\/. -](\d{2,4})$/);
    if (match) {
      const year = match[3].length === 2 ? `20${match[3]}` : match[3];
      const candidate = `${year}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
      const parsed = new Date(`${candidate}T00:00:00`);
      return Number.isNaN(parsed.getTime()) ? "" : candidate;
    }
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? "" : dateKey(parsed);
  }

  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;
    const events = JSON.parse(saved);
    if (!Array.isArray(events)) return;
    const cleaned = events.map((event) => {
      const next = { ...event };
      dateFields.forEach((field) => {
        next[field] = normaliseDate(next[field]);
      });
      next.clientName ||= "New enquiry";
      next.eventType ||= "TBC";
      next.status ||= "Enquiry";
      return next;
    });
    localStorage.setItem(storageKey, JSON.stringify(cleaned));
  } catch (error) {
    console.warn("Could not normalise stored event dates", error);
  }
})();