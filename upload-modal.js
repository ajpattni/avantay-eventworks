const uploadEventNav = document.querySelector("#uploadEventNav");
const uploadModal = document.querySelector("#uploadModal");
const closeUploadModalButton = document.querySelector("#closeUploadModalButton");
const cancelUploadModalButton = document.querySelector("#cancelUploadModalButton");
const uploadInput = document.querySelector("#eventUploadInput");

function openUploadModal() {
  if (uploadInput) uploadInput.value = "";
  uploadModal?.classList.remove("hidden");
}

function closeUploadModal() {
  uploadModal?.classList.add("hidden");
  if (uploadInput) uploadInput.value = "";
}

uploadEventNav?.addEventListener("click", openUploadModal);
closeUploadModalButton?.addEventListener("click", closeUploadModal);
cancelUploadModalButton?.addEventListener("click", closeUploadModal);
uploadInput?.addEventListener("change", () => window.setTimeout(closeUploadModal, 50));
uploadModal?.addEventListener("click", (event) => {
  if (event.target === uploadModal) closeUploadModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !uploadModal?.classList.contains("hidden")) closeUploadModal();
});