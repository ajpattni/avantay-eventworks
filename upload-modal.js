const uploadEventNav = document.querySelector("#uploadEventNav");
const uploadModal = document.querySelector("#uploadModal");
const closeUploadModalButton = document.querySelector("#closeUploadModalButton");
const cancelUploadModalButton = document.querySelector("#cancelUploadModalButton");
const uploadInput = document.querySelector("#eventUploadInput");

const uploadImportColumns = [
  ["Client full name", "clientName", "text", true],
  ["Phone", "phone", "text"],
  ["Email", "email", "text"],
  ["Heard from", "heardFrom", "text"],
  ["Event type", "eventType", "text", true],
  ["Event date", "eventDate", "date", true],
  ["Start time", "startTime", "time"],
  ["End time", "endTime", "time"],
  ["Adults", "adults", "number"],
  ["Children", "children", "number"],
  ["Status", "status", "status"],
  ["Tables", "tables", "text"],
  ["Chairs", "chairs", "text"],
  ["Layout", "layout", "text"],
  ["Colour theme", "colourTheme", "text"],
  ["Linen colour", "linenColour", "text"],
  ["Chair sash", "chairSash", "text"],
  ["Decor notes", "decorNotes", "text"],
  ["DJ required", "djRequired", "boolean"],
  ["DJ notes", "djNotes", "text"],
  ["Menu tier", "menuTier", "text"],
  ["Starter", "starter", "text"],
  ["Main", "main", "text"],
  ["Dessert", "dessert", "text"],
  ["Dietary requirements", "dietary", "text"],
  ["Catering notes", "cateringNotes", "text"],
  ["Bar package", "barPackage", "text"],
  ["Welcome drink", "welcomeDrink", "text"],
  ["Free soft drinks included", "softDrinks", "boolean"],
  ["Bar notes", "barNotes", "text"],
  ["FOH count", "fohCount", "number"],
  ["Bar staff count", "barStaffCount", "number"],
  ["Kitchen staff count", "kitchenStaffCount", "number"],
  ["Staffing notes", "staffingNotes", "text"],
  ["Total value", "totalValue", "number"],
  ["Deposit due", "depositDue", "number"],
  ["Deposit received", "depositReceived", "boolean"],
  ["Deposit received date", "depositReceivedDate", "date"],
  ["Balance due date", "balanceDueDate", "date"],
  ["Balance received", "balanceReceived", "boolean"],
  ["Balance received date", "balanceReceivedDate", "date"],
  ["Payment notes", "paymentNotes", "text"],
  ["General notes", "generalNotes", "text"],
];

const uploadAliases = {
  clientName: ["clientname", "client", "name", "fullname", "customername", "customer"],
  eventType: ["eventtype", "type", "bookingtype", "event"],
  eventDate: ["eventdate", "date", "bookingdate", "functiondate"],
  startTime: ["start", "starttime", "arrival", "arrivaltime"],
  endTime: ["end", "endtime", "finishtime", "finish"],
  adults: ["adult", "adults", "adultguests", "guestcount", "guests", "pax"],
  children: ["child", "children", "childguests"],
  phone: ["phone", "telephone", "mobile", "contactnumber"],
  email: ["email", "emailaddress"],
};

function openUploadModal() {
  if (uploadInput) uploadInput.value = "";
  uploadModal?.classList.remove("hidden");
}

function closeUploadModal() {
  uploadModal?.classList.add("hidden");
  if (uploadInput) uploadInput.value = "";
}

async function importEventFileFromModal(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (!window.XLSX) {
    alert("The Excel import library could not load. Please refresh and try again.");
    return;
  }

  try {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    const rows = findUploadRows(workbook);
    const imported = rows.map(uploadRowToEvent).filter(Boolean);
    if (!imported.length) {
      alert("No valid events found. Please check these columns are filled in: Client full name, Event type, Event date.");
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

function findUploadRows(workbook) {
  let foundHeaders = [];
  for (const sheetName of workbook.SheetNames) {
    const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "", raw: false });
    const headerIndex = matrix.findIndex((row) => row.some((cell) => isUploadHeader(cell)));
    if (headerIndex === -1) continue;
    const headers = matrix[headerIndex].map((header) => String(header || "").trim());
    foundHeaders = headers.filter(Boolean);
    const hasRequired = ["clientName", "eventType", "eventDate"].every((field) =>
      headers.some((header) => uploadHeaderMatches(header, field))
    );
    if (!hasRequired) continue;
    return matrix
      .slice(headerIndex + 1)
      .filter((row) => row.some((cell) => cell !== ""))
      .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]).filter(([header]) => header)));
  }
  const found = foundHeaders.length ? ` Found columns: ${foundHeaders.slice(0, 8).join(", ")}.` : "";
  throw new Error(`I couldn't find the required columns: Client full name, Event type, Event date.${found}`);
}

function uploadRowToEvent(row) {
  const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [uploadNorm(key), value]));
  const record = { id: crypto.randomUUID(), status: "Enquiry", depositReceived: false, balanceReceived: false };
  uploadImportColumns.forEach(([header, field, type]) => {
    const keys = [uploadNorm(header), ...(uploadAliases[field] || [])];
    const value = keys.map((key) => normalized[key]).find((item) => item !== undefined && item !== null && item !== "");
    record[field] = uploadParse(value, type);
  });
  if (!record.status || !["Enquiry", "Quote sent", "Deposit paid", "Confirmed", "Completed", "Cancelled"].includes(record.status)) {
    record.status = "Enquiry";
  }
  return record.clientName && record.eventType && record.eventDate ? record : null;
}

function uploadParse(value, type) {
  if (value === undefined || value === null || value === "") return type === "boolean" ? false : "";
  const text = value.toString().trim();
  if (type === "boolean") return ["yes", "y", "true", "1", "paid", "required", "included"].includes(text.toLowerCase());
  if (type === "number") {
    const number = Number(text.replace(/[£,]/g, ""));
    return Number.isNaN(number) ? "" : number;
  }
  if (type === "date") return uploadDate(value);
  if (type === "time") return uploadTime(text);
  return text;
}

function uploadDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return uploadDateKey(value);
  const text = value.toString().trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const match = text.match(/^(\d{1,2})[\/. -](\d{1,2})[\/. -](\d{2,4})$/);
  if (match) return `${match[3].length === 2 ? "20" + match[3] : match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? "" : uploadDateKey(parsed);
}

function uploadTime(text) {
  const match = text.match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)?$/i);
  if (!match) return text;
  let hours = Number(match[1]);
  const minutes = match[2] || "00";
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

function isUploadHeader(value) {
  return uploadImportColumns.some(([header, field]) => uploadHeaderMatches(value, field) || uploadNorm(value) === uploadNorm(header));
}

function uploadHeaderMatches(header, field) {
  const normalized = uploadNorm(header);
  const templateHeader = uploadImportColumns.find(([, mappedField]) => mappedField === field)?.[0] || "";
  return uploadNorm(templateHeader) === normalized || (uploadAliases[field] || []).includes(normalized);
}

function uploadNorm(value) {
  return (value ?? "").toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function uploadDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

uploadEventNav?.addEventListener("click", openUploadModal);
closeUploadModalButton?.addEventListener("click", closeUploadModal);
cancelUploadModalButton?.addEventListener("click", closeUploadModal);
if (uploadInput) uploadInput.onchange = importEventFileFromModal;
uploadModal?.addEventListener("click", (event) => {
  if (event.target === uploadModal) closeUploadModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !uploadModal?.classList.contains("hidden")) closeUploadModal();
});