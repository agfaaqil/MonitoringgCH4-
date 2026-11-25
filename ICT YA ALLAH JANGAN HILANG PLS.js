const BLYNK_TOKEN = "rBLfwZ9JH12qGT-Mn9imwo6D8hdtN1Qi";
const BASE = "https://blynk.cloud/external/api/get?token=" + BLYNK_TOKEN;

async function ambilPin(pin) {
  const res = await fetch(BASE + "&" + pin);
  if (!res.ok) throw new Error(pin + " -> HTTP " + res.status);
  return (await res.text()).trim();
}

async function ambilDataBlynk() {
  const ppmEl = document.getElementById("ppmValue");
  const statusEl = document.getElementById("gasStatus");
  const connEl = document.getElementById("connectionText");
  const blynkEl = document.getElementById("blynkStatus");
  const updateEl = document.getElementById("lastUpdate");
  const ratioEl = document.getElementById("ratioValue");
  const adcEl = document.getElementById("adcValue");

  const hasil = await Promise.allSettled([
    ambilPin("V0"),
    ambilPin("V1"),
    ambilPin("V2"),
    ambilPin("V3"),
  ]);
  console.log("Hasil Blynk:", hasil);

  const [v0, v1, v2, v3] = hasil;

  if (v0.status === "fulfilled" && !isNaN(parseFloat(v0.value))) {
    ppmEl.textContent = parseFloat(v0.value).toFixed(1);
    connEl.textContent = "Terhubung";
    if (blynkEl) blynkEl.textContent = "Terhubung";
    if (updateEl) {
      updateEl.textContent =
        "Update terakhir: " + new Date().toLocaleTimeString("id-ID");
    }
  } else {
    connEl.textContent = "Terputus";
    if (blynkEl) blynkEl.textContent = "Terputus";
  }

  if (v1.status === "fulfilled") ratioEl.textContent = parseFloat(v1.value).toFixed(2);
  if (v2.status === "fulfilled") statusEl.textContent = v2.value;
  if (v3.status === "fulfilled") adcEl.textContent = v3.value;

  hasil.forEach((h, i) => {
    if (h.status === "rejected") console.error("Gagal pin V" + i + ":", h.reason);
  });
}

ambilDataBlynk();
setInterval(ambilDataBlynk, 3000);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}