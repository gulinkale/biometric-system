// frontend/assets/js/portal.js

window.portal = {
  init() {
    console.log("[PORTAL] init");

    const btn = document.getElementById("btn-biometric-login");

    if (btn) {
      btn.addEventListener("click", () => {
        window.location.href = "/biometric/identify.html";
      });
    }
  },
};

document.addEventListener("DOMContentLoaded", () => {
  window.portal.init();
});