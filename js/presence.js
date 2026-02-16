const userId = localStorage.getItem("userId");

if (userId) {

  async function updateActive() {
    try {
      await fetch("/.netlify/functions/update-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    } catch (err) {
      console.error("Active update failed:", err);
    }
  }

  // Run immediately
  updateActive();

  // Keep updating
  setInterval(updateActive, 30000);

  // Handle leaving page
  window.addEventListener("beforeunload", () => {
    navigator.sendBeacon(
      "/.netlify/functions/user-offline",
      JSON.stringify({ userId })
    );
  });

}
