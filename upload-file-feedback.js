const uploadFileName = document.querySelector("#uploadFileName");

const looseColumns = [
  ["Client full name", "clientName", "text"], ["Phone", "phone", "text"], ["Email", "email", "text"], ["Heard from", "heardFrom", "text"],
  ["Event type", "eventType", "text"], ["Event date", "eventDate", "date"], ["Start time", "startTime", "time"], ["End time", "endTime", "time"],
  ["Adults", "adults", "number"], ["Children", "children", "number"], ["Status", "status", "status"], ["Tables", "tables", "text"],
  ["Chairs", "chairs", "text"], ["Layout", "layout", "text"], ["Colour theme", "colourTheme", "text"], ["Linen colour", "linenColour", "text"],
  ["Chair sash", "chairSash", "text"], ["Decor notes", "decorNotes", "text"], ["DJ required", "djRequired", "boolean"], ["DJ notes", "djNotes", "text"],
  ["Menu tier", "menuTier", "text"], ["Starter", "starter", "text"], ["Main", "main", "text"], ["Dessert", "dessert", "text"],
  ["Dietary requirements", "dietary", "text"], ["Catering notes", "cateringNotes", "text"], ["Bar package", "barPackage", "text"], ["Welcome drink", "welcomeDrink", "text"],
  ["Free soft drinks included", "softDrinks", "boolean"], ["Bar notes", "barNotes", "text"], ["FOH count", "fohCount", "number"], ["Bar staff count", "barStaffCount", "number"],
  ["Kitchen staff count", "kitchenStaffCount", "number"], ["Staffing notes", "staffingNotes", "text"], ["Total value", "totalValue", "number"], ["Deposit due", "depositDue", "number"],
  ["Deposit received", "depositReceived", "boolean"], ["Deposit received date", "depositReceivedDate", "date"], ["Balance due date", "balanceDueDate", "date"],
  ["Balance received", "balanceReceived", "boolean"], ["Balance received date", "balanceReceivedDate", "date"], ["Payment notes", "paymentNotes", "text"], ["General notes", "generalNotes", "text"],
];

const looseAliases = {
  clientName: ["clientname", "client", "name", "fullname", "customername", "customer"],
  eventType: ["eventtype", "type", "bookingtype", "event", "occasion"],
  eventDate: ["eventdate", "date", "bookingdate", "functiondate", "preferreddate"],
  startTime: ["start", "starttime", "arrival", "arrivaltime"],
  endTime: ["end", "endtime", "finishtime", "finish"],
  adults: ["adult", "adults", "adultguests", "guestcount", "guests", "pax"],
  children: ["child", "children", "childguests"],
  phone: ["phone", "telephone", "mobile", "contactnumber"],
  email: ["email", "emailaddress"],
  generalNotes: ["notes", "note", "enquirynotes", "comments"],
};

function resetUploadFileName() {
  if (uploadFileName) uploadFileName.textContent = "No file selected";
}

async function importLooseEventFile(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (uploadFileName) uploadFileName.textContent = file.name;
  if (!window.XLSX) {
    alert("The Excel import library could not load. Please refresh and try again.");
    return;
  }
  try {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    const rows = findLooseRows(workbook);
    const imported = rows.map(looseRowToEvent).filter(Boolean);
    if (!imported.length) {
      alert("No event details were found in that file. Add at least one client name, phone, email, event type, date, or note.");
      return;
    }
    events = [...imported, ...events];
    selectedId = imported[0].id;
    currentView = "dashboard";
    save();
    render();
    closeUploadModal();
    alert(`Imported ${imported.length} event${imported.length === 1 ? "" : "s"}.`);
  } catch (error) {
    console.error(error);
    alert(error.message || "That file could not be imported. Please use the Avantay import template and try again.");
  }
}

function findLooseRows(workbook) {
  let foundHeaders = [];
  for (const sheetName of workbook.SheetNames) {
    const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "", raw: false });
    const headerIndex = matrix.findIndex((row) => row.some((cell) => isLooseHeader(cell)));
    if (headerIndex === -1) continue;
    const headers = matrix[headerIndex].map((header) => String(header || "").trim());
    foundHeaders = headers.filter(Boolean);
    return matrix
      .slice(headerIndex + 1)
      .filter((row) => row.some((cell) => cell !== ""))
      .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]).filter(([header]) => header)));
  }
  const found = foundHeaders.length ? ` Found columns: ${foundHeaders.slice(0, 8).join(", ")}.` : "";
  throw new Error(`I couldn't find any recognised import columns.${found}`);
}

function looseRowToEvent(row) {
  const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [looseNorm(key), value]));
  const record = { id: crypto.randomUUID(), status: "Enquiry", depositReceived: false, balanceReceived: false };
  looseColumns.forEach(([header, field, type]) => {
    const keys = [looseNorm(header), ...(looseAliases[field] || [])];
    const value = keys.map((key) => normalized[key]).find((item) => item !== undefined && item !== null && item !== "");
    record[field] = looseParse(value, type);
  });
  if (!record.status || !["Enquiry", "Quote sent", "Deposit paid", "Confirmed", "Completed", "Cancelled"].includes(record.status)) record.status = "Enquiry";
  const hasDetails = looseColumns.some(([, field]) => {
    const value = record[field];
    return value !== undefined && value !== null && value !== "" && value !== false;
  });
  if (!hasDetails) return null;
  record.clientName ||= "New enquiry";
  record.eventType ||= "TBC";
  return record;
}

function looseParse(value, type) {
  if (value === undefined || value === null || value === "") return type === "boolean" ? false : "";
  const text = value.toString().trim();
  if (type === "boolean") return ["yes", "y", "true", "1", "paid", "required", "included"].includes(text.toLowerCase());
  if (type === "number") {
    const number = Number(text.replace(/[£,]/g, ""));
    return Number.isNaN(number) ? "" : number;
  }
  if (type === "date") return looseDate(value);
  if (type === "time") return looseTime(text);
  return text;
}

function looseDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return looseDateKey(value);
  const text = value.toString().trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const match = text.match(/^(\d{1,2})[\/. -](\d{1,2})[\/. -](\d{2,4})$/);
  if (match) return `${match[3].length === 2 ? "20" + match[3] : match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? "" : looseDateKey(parsed);
}

function looseTime(text) {
  const match = text.match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)?$/i);
  if (!match) return text;
  let hours = Number(match[1]);
  const minutes = match[2] || "00";
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

function isLooseHeader(value) {
  return looseColumns.some(([header, field]) => looseHeaderMatches(value, field) || looseNorm(value) === looseNorm(header));
}

function looseHeaderMatches(header, field) {
  const normalized = looseNorm(header);
  const templateHeader = looseColumns.find(([, mappedField]) => mappedField === field)?.[0] || "";
  return looseNorm(templateHeader) === normalized || (looseAliases[field] || []).includes(normalized);
}

function looseNorm(value) {
  return (value ?? "").toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function looseDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

uploadEventNav?.addEventListener("click", resetUploadFileName);
closeUploadModalButton?.addEventListener("click", resetUploadFileName);
cancelUploadModalButton?.addEventListener("click", resetUploadFileName);
uploadModal?.addEventListener("click", (event) => {
  if (event.target === uploadModal) resetUploadFileName();
});
if (uploadInput) uploadInput.onchange = importLooseEventFile;