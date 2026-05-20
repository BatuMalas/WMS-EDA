/**
 * ============================================================
 * UC-03 Outbound — Diagnostik Beban Ringan
 * ============================================================
 * Fase: 3 RPS -> 7 RPS -> 15 RPS (masing-masing 60s)
 * 
 * Jalankan:
 *   k6 run --summary-export=results/diag-outbound-summary.json scripts/diag-light-outbound.js
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
  generateOutboundPayload,
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
      preAllocatedVUs: 20,
      maxVUs: 100,
      stages: [
        { duration: "10s", target: 1 },
        { duration: "5s", target: 3 },
        { duration: "60s", target: 3 },
        { duration: "5s", target: 7 },
        { duration: "60s", target: 7 },
        { duration: "5s", target: 15 },
        { duration: "60s", target: 15 },
        { duration: "10s", target: 0 },
      ],
      tags: { scenario: "diagnostic_outbound" },
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.10"],
    diag_error_rate: ["rate<0.10"],
    diag_create_duration: ["p(95)<10000"],
    diag_approve_duration: ["p(95)<15000"],
  },
};

// ─── Setup ───────────────────────────────────────────────────
export function setup() {
  console.log("========================================================");
  console.log("  DIAGNOSTIK BEBAN RINGAN — UC-03 Outbound");
  console.log("========================================================");

  const staffToken = login(STAFF_CREDENTIALS);
  const manajerToken = login(MANAJER_CREDENTIALS);

  if (!staffToken || !manajerToken) {
    throw new Error("Login gagal — cek koneksi backend.");
  }

  return { staffToken, manajerToken };
}

// ─── Main ────────────────────────────────────────────────────
export default function (data) {
  const { staffToken, manajerToken } = data;
  const e2eStart = Date.now();
  let passed = true;

  // Step 1 — Create transaksi keluar
  const t0 = Date.now();
  const createRes = http.post(
    `${BASE_URL}/transaksi`,
    JSON.stringify(generateOutboundPayload()),
    getAuthHeaders(staffToken),
  );
  createDuration.add(Date.now() - t0);

  const created = check(createRes, {
    "create — status 201": (r) => r.status === 201,
  });

  if (!created) {
    failCount.add(1);
    errorRate.add(1);
    return;
  }

  const transaksiId = extractTransaksiId(createRes);

  // Step 2 — Approve
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
    });

    if (!approved) passed = false;
  }

  e2eDuration.add(Date.now() - e2eStart);
  passed
    ? (successCount.add(1), errorRate.add(0))
    : (failCount.add(1), errorRate.add(1));
  sleep(0.05);
}
