import { trackPrevPage } from "./navigation.js";

trackPrevPage();

const page = document.body.dataset.page;

async function boot() {
  try {
    if (page === "enroll") {
      const mod = await import("./enroll.js");
      mod.initEnroll();
      return;
    }

    if (page === "identify") {
      const mod = await import("./identify.js");
      mod.initIdentify();
    }
  } catch (err) {
    console.error("[BOOT ERROR]", err);
  }
}

boot();