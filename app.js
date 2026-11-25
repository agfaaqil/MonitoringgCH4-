const BLYNK_TOKEN = "rBLfwZ9JH12qGT-Mn9imwo6D8hdtN1Qi";
const BASE = "https://blynk.cloud/external/api/get?token=" + BLYNK_TOKEN;

const BATAS_AMAN = 300;
const BATAS_BAHAYA = 800;

function saranWaktu() {
  const jam = new Date().getHours();
  if (jam >= 5 && jam < 9)
    return "Waktu pelaksanaan: lakukan sekarang, pagi hari (sebelum pukul 09.00) adalah waktu terbaik karena suhu masih rendah.";
  if (jam >= 9 && jam < 16)
    return "Waktu pelaksanaan: hindari siang yang panas. Jadwalkan sore pukul 16.00-18.00, atau besok pagi pukul 06.00-09.00.";
  if (jam >= 16 && jam < 18)
    return "Waktu pelaksanaan: lakukan sekarang, sore hari (pukul 16.00-18.00) masih sesuai.";
  return "Waktu pelaksanaan: jadwalkan besok pagi pukul 06.00-09.00.";
}

const SARAN = {
  AMAN: {
    ringkas: "Kadar gas masih dalam batas aman. Tidak ada tindakan khusus.",
    target: "Pertahankan di bawah 300 PPM",
    langkah: [
      "Pertahankan pengelolaan air dan lahan seperti biasa.",
      "Hindari menumpuk jerami atau bahan organik segar di satu titik.",
      "Tetap pantau data secara berkala.",
    ],
  },
  WASPADA: {
    ringkas: "Kadar gas mulai tinggi. Perlu tindakan agar tidak naik ke level bahaya.",
    target: "Turunkan hingga di bawah 300 PPM dan jaga tetap stabil",
    langkah: [
      "Periksa kondisi tanah dan genangan air di sekitar sensor.",
      "Jika lahan tergenang, keringkan sebagian dan terapkan pengairan berselang (tanah dibiarkan macak-macak 2-3 hari).",
      "Jika ada tumpukan jerami atau kompos, balik tumpukannya agar udara masuk.",
      "Jika tanah kering dan tidak tergenang, siram secukupnya agar suhu tanah turun, jangan sampai tergenang.",
      "Pantau data sampai kadar gas turun dan stabil di bawah 300 PPM.",
    ],
  },
  BAHAYA: {
    ringkas: "Kadar gas tinggi. Segera lakukan tindakan dan jaga keselamatan.",
    target: "Turunkan segera hingga di bawah 300 PPM",
    langkah: [
      "Jauhkan api, rokok, dan alat yang menimbulkan percikan dari area ini (metana mudah terbakar).",
      "Jangan masuk atau berdiam lama di ruang tertutup seperti gudang atau greenhouse di sekitar sensor.",
      "Keringkan genangan air yang menumpuk dan balik tumpukan bahan organik.",
      "Buka ventilasi agar udara bersirkulasi.",
      "Jika kadar gas terus naik, hentikan aktivitas di area ini dan minta bantuan pihak yang berwenang.",
    ],
  },
};

function tentukanStatus(ppm) {
  if (ppm >= BATAS_BAHAYA) return "BAHAYA";
  if (ppm >= BATAS_AMAN) return "WASPADA";
  return "AMAN";
}

function tampilkanAnalisis(ppm, statusAlat) {
  let kunci = String(statusAlat || "").trim().toUpperCase();
  if (!SARAN[kunci]) kunci = tentukanStatus(ppm);
  const data = SARAN[kunci];

  const badge = document.getElementById("analysisBadge");
  if (!badge) return;
  badge.textContent = kunci;
  badge.className = "badge " + kunci.toLowerCase();

  document.getElementById("ringkasan").textContent =
    "Kadar gas terdeteksi " + ppm.toFixed(1) + " PPM dan berstatus " + kunci + ". " + data.ringkas;

  const selisih = document.getElementById("selisih");
  selisih.textContent =
    ppm < BATAS_AMAN
      ? (BATAS_AMAN - ppm).toFixed(1) + " PPM di bawah batas aman"
      : (ppm - BATAS_AMAN).toFixed(1) + " PPM di atas batas aman";

  document.getElementById("targetText").textContent = data.target;

  const gauge = document.getElementById("gaugeFill");
  gauge.style.width = Math.min((ppm / 1000) * 100, 100) + "%";
  gauge.className = "gauge-fill " + kunci.toLowerCase();

  const langkah = data.langkah.slice();
  if (kunci !== "AMAN") langkah.push(saranWaktu());

  const daftar = document.getElementById("adviceList");
  daftar.innerHTML = "";
  langkah.forEach((teks) => {
    const li = document.createElement("li");
    li.textContent = teks;
    daftar.appendChild(li);
  });
}

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
  const ppm = v0.status === "fulfilled" ? parseFloat(v0.value) : NaN;

  if (!isNaN(ppm)) {
    ppmEl.textContent = ppm.toFixed(1);
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

  if (!isNaN(ppm)) {
    tampilkanAnalisis(ppm, v2.status === "fulfilled" ? v2.value : "");
  }

  hasil.forEach((h, i) => {
    if (h.status === "rejected") console.error("Gagal pin V" + i + ":", h.reason);
  });
}

ambilDataBlynk();
setInterval(ambilDataBlynk, 5000);

const slider = document.getElementById("slider");
const tombolSlide = document.querySelectorAll(".slide-nav button");

if (slider) {
  slider.scrollLeft = 0;

  tombolSlide.forEach((tombol, i) => {
    tombol.addEventListener("click", () => {
      slider.scrollTo({ left: slider.clientWidth * i, behavior: "smooth" });
    });
  });

  slider.addEventListener("scroll", () => {
    const i = Math.round(slider.scrollLeft / slider.clientWidth);
    tombolSlide.forEach((t, j) => t.classList.toggle("active", j === i));
  });
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
