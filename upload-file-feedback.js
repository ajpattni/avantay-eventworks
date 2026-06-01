const uploadFileName = document.querySelector("#uploadFileName");

function resetUploadFileName() {
  if (uploadFileName) uploadFileName.textContent = "No file selected";
}

uploadEventNav?.addEventListener("click", resetUploadFileName);
closeUploadModalButton?.addEventListener("click", resetUploadFileName);
cancelUploadModalButton?.addEventListener("click", resetUploadFileName);
uploadModal?.addEventListener("click", (event) => {
  if (event.target === uploadModal) resetUploadFileName();
});
uploadInput?.addEventListener(
  "change",
  (event) => {
    const file = event.target.files?.[0];
    if (uploadFileName && file) uploadFileName.textContent = file.name;
  },
  { capture: true }
);