/**
 * ============================================================
 * UC-01 Inbound — Diagnostik Beban Ringan
 * ============================================================
 * Tujuan: Cari titik stabil sistem sebelum saturasi.
 * Fase:
 *   3 RPS  (60s) → harusnya 0% error, latency rendah
 *   7 RPS  (60s) → masih stabil
 *  15 RPS  (60s) → mulai lihat kenaikan latency
 *
 * Jalankan:
 *   k6 run --summary-export=results/diag-summary.json scripts/diag-light.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";

import {
  BASE_URL,
  STAFF_CREDENTIALS,
  MANAJER_CREDENTIALS,
  login,
  getAuthHeaders,
  generateInboundPayload,
  extractTransaksiId,
} from "./config.js";

// ─── Custom Metrics ──────────────────────────────────────────
const createDuration = new Trend("diag_create_duration", true);
const approveDuration = new Trend("diag_approve_duration", true);
const e2eDuration = new Trend("diag_e2e_duration", true);
const successCount = new Counter("diag_success");
const failCount = new Counter("diag_fail");
const errorRate = new Rate("diag_error_rate");

// ─── k6 Options ──────────────────────────────────────────────
export const options = {
  scenarios: {
    diag_light: {
      executor: "ramping-arrival-rate",
      startRate: 1,
      timeUnit: "1s",
      preAllocatedVUs: 10,
      maxVUs: 20,
      stages: [
        // warm-up
        { duration: "10s", target: 1 },

        // Fase 1: 3 RPS — sustain 60s
        { duration: "5s", target: 3 },
        { duration: "60s", target: 3 },

        // Fase 2: 7 RPS — sustain 60s
        { duration: "5s", target: 7 },
        { duration: "60s", target: 7 },

        // Fase 3: 15 RPS — sustain 60s
        { duration: "5s", target: 15 },
        { duration: "60s", target: 15 },

        // cool-down
        { duration: "10s", target: 0 },
      ],
      tags: { scenario: "diagnostic" },
    },
  },
  // Threshold longgar — tujuan hanya observasi, bukan pass/fail
  thresholds: {
    http_req_failed: ["rate<0.10"],
    diag_error_rate: ["rate<0.10"],
    diag_create_duration: ["p(95)<10000"],
    diag_approve_duration: ["p(95)<15000"],
    diag_e2e_duration: ["p(95)<20000"],
  },
  summaryTrendStats: [
    "avg",
    "min",
    "med",
    "max",
    "p(90)",
    "p(95)",
    "p(99)",
    "count",
  ],
};

// ─── Setup ───────────────────────────────────────────────────
export function setup() {
  console.log("");
  console.log("========================================================");
  console.log("  DIAGNOSTIK BEBAN RINGAN — UC-01 Inbound");
  console.log("  Fase: 3 RPS -> 7 RPS -> 15 RPS (masing-masing 60s)");
  console.log("========================================================");
  console.log("");

  const staffToken = login(STAFF_CREDENTIALS);
  const manajerToken = login(MANAJER_CREDENTIALS);

  if (!staffToken || !manajerToken) {
    throw new Error("Login gagal — cek koneksi backend dan seeder.");
  }

  console.log("  [OK] Staff token    : " + STAFF_CREDENTIALS.username);
  console.log("  [OK] Manajer token  : " + MANAJER_CREDENTIALS.username);
  console.log("  [OK] Base URL       : " + BASE_URL);
  console.log("");

  return { staffToken, manajerToken };
}

// ─── Main ────────────────────────────────────────────────────
export default function (data) {
  const { staffToken, manajerToken } = data;
  const e2eStart = Date.now();
  let passed = true;

  // Step 1 — Create transaksi masuk
  const t0 = Date.now();
  const createRes = http.post(
    `${BASE_URL}/transaksi`,
    JSON.stringify(generateInboundPayload()),
    getAuthHeaders(staffToken),
  );
  createDuration.add(Date.now() - t0);

  const created = check(createRes, {
    "create — status 201": (r) => r.status === 201,
    "create — ada id": (r) => {
      try {
        return !!JSON.parse(r.body).data?.id;
      } catch {
        return false;
      }
    },
  });

  if (!created) {
    failCount.add(1);
    errorRate.add(1);
    console.warn(`[FAIL] Create gagal — status: ${createRes.status}`);
    e2eDuration.add(Date.now() - e2eStart);
    return;
  }

  const transaksiId = extractTransaksiId(createRes);

  // Step 2 — Approve (update stok sinkron)
  if (transaksiId) {
    sleep(0.05);
    const t1 = Date.now();
    const approveRes = http.put(
      `${BASE_URL}/transaksi/${transaksiId}/approve`,
      null,
      getAuthHeaders(manajerToken),
    );
    approveDuration.add(Date.now() - t1);

    const approved = check(approveRes, {
      "approve — status 200": (r) => r.status === 200,
      "approve — status diterima": (r) => {
        try {
          return JSON.parse(r.body).data?.status === "diterima";
        } catch {
          return false;
        }
      },
    });

    if (!approved) {
      passed = false;
      console.warn(
        `[FAIL] Approve gagal — status: ${approveRes.status}, id: ${transaksiId}`,
      );
    }
  }

  e2eDuration.add(Date.now() - e2eStart);
  passed
    ? (successCount.add(1), errorRate.add(0))
    : (failCount.add(1), errorRate.add(1));
  sleep(0.05);
}

// ─── Teardown ────────────────────────────────────────────────
export function teardown() {
  console.log("");
  console.log("========================================================");
  console.log("  DIAGNOSTIK SELESAI");
  console.log("  Cek kolom berikut di output:");
  console.log("    diag_create_duration  → latency POST /transaksi");
  console.log("    diag_approve_duration → latency PUT /approve (terberat)");
  console.log("    diag_e2e_duration     → end-to-end per VU");
  console.log("    diag_error_rate       → persen request gagal");
  console.log("  Hasil: results/diag-summary.json");
  console.log("========================================================");
  console.log("");
}
