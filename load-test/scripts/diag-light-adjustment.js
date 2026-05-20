/**
 * ============================================================
 * UC-02 Stock Adjustment — Diagnostik Beban Ringan
 * ============================================================
 * Fase: 3 RPS -> 7 RPS -> 15 RPS (masing-masing 60s)
 * 
 * Jalankan:
 *   k6 run --summary-export=results/diag-adjustment-summary.json scripts/diag-light-adjustment.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";

import {
  BASE_URL,
  STAFF_CREDENTIALS,
  login,
  getAuthHeaders,
  generateStockAdjustmentPayload,
  randomBarangId,
} from "./config.js";

// ─── Custom Metrics ──────────────────────────────────────────
const adjustmentDuration = new Trend("diag_adjustment_duration", true);
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
      tags: { scenario: "diagnostic_adjustment" },
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.10"],
    diag_error_rate: ["rate<0.10"],
    diag_adjustment_duration: ["p(95)<5000"],
  },
};

// ─── Setup ───────────────────────────────────────────────────
export function setup() {
  console.log("========================================================");
  console.log("  DIAGNOSTIK BEBAN RINGAN — UC-02 Stock Adjustment");
  console.log("========================================================");

  const staffToken = login(STAFF_CREDENTIALS);

  if (!staffToken) {
    throw new Error("Login gagal — cek koneksi backend.");
  }

  return { staffToken };
}

// ─── Main ────────────────────────────────────────────────────
export default function (data) {
  const { staffToken } = data;
  const barangId = randomBarangId();

  // Step 1 — Stock Adjustment (Tambah Stok)
  const t0 = Date.now();
  const res = http.post(
    `${BASE_URL}/barang/${barangId}/stok/tambah`,
    JSON.stringify(generateStockAdjustmentPayload()),
    getAuthHeaders(staffToken),
  );
  adjustmentDuration.add(Date.now() - t0);

  const success = check(res, {
    "adjustment — status 200": (r) => r.status === 200,
    "adjustment — data success": (r) => {
      try {
        return JSON.parse(r.body).success === true;
      } catch {
        return false;
      }
    },
  });

  if (success) {
    successCount.add(1);
    errorRate.add(0);
  } else {
    failCount.add(1);
    errorRate.add(1);
    console.warn(`[FAIL] Adjustment gagal — status: ${res.status}, barang: ${barangId}`);
  }

  sleep(0.1);
}
