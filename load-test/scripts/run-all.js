/**
 * ============================================================
 * Run All: Menjalankan UC-01, UC-02, UC-03 secara berurutan
 * ============================================================
 * Script ini menjalankan ketiga skenario dalam satu eksekusi k6
 * dengan scenario scheduling yang berurutan (sequential).
 *
 * Setiap skenario mendapat waktu sendiri sehingga metrik
 * tidak tercampur. Total durasi: ~3 × (330 detik + buffer).
 *
 * Cara menjalankan:
 *   k6 run load-test/scripts/run-all.js
 *
 * Export hasil:
 *   k6 run --out json=load-test/results/all-results.json load-test/scripts/run-all.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

import {
  BASE_URL,
  STAFF_CREDENTIALS,
  MANAJER_CREDENTIALS,
  STANDARD_THRESHOLDS,
  login,
  getAuthHeaders,
  generateInboundPayload,
  generateOutboundPayload,
  generateStockAdjustmentPayload,
  randomBarangId,
  extractTransaksiId,
} from './config.js';

// ─── Custom Metrics (all scenarios) ──────────────────────────
// UC-01
const uc01CreateDuration = new Trend('uc01_inbound_create_duration', true);
const uc01ApproveDuration = new Trend('uc01_inbound_approve_duration', true);
const uc01E2eDuration = new Trend('uc01_inbound_e2e_duration', true);
const uc01Success = new Counter('uc01_success_count');
const uc01Fail = new Counter('uc01_fail_count');

// UC-02
const uc02AdjDuration = new Trend('uc02_adjustment_duration', true);
const uc02DashDuration = new Trend('uc02_dashboard_read_duration', true);
const uc02E2eDuration = new Trend('uc02_e2e_duration', true);
const uc02Success = new Counter('uc02_success_count');
const uc02Fail = new Counter('uc02_fail_count');

// UC-03
const uc03CreateDuration = new Trend('uc03_outbound_create_duration', true);
const uc03ApproveDuration = new Trend('uc03_outbound_approve_duration', true);
const uc03E2eDuration = new Trend('uc03_outbound_e2e_duration', true);
const uc03Success = new Counter('uc03_success_count');
const uc03Fail = new Counter('uc03_fail_count');

// ─── Stage Template ─────────────────────────────────────────
const STAGES = [
  { duration: '10s', target: 10 },
  { duration: '10s', target: 50 },
  { duration: '60s', target: 50 },
  { duration: '10s', target: 100 },
  { duration: '90s', target: 100 },
  { duration: '15s', target: 200 },
  { duration: '120s', target: 200 },
  { duration: '15s', target: 0 },
];

// Total durasi per scenario: ~330 detik

// ─── k6 Options ──────────────────────────────────────────────
export const options = {
  scenarios: {
    // UC-01 dimulai di detik ke-0
    uc01_inbound: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 250,
      maxVUs: 500,
      stages: STAGES,
      startTime: '0s',
      exec: 'uc01Inbound',
      tags: { scenario: 'UC-01-Inbound' },
    },
    // UC-02 dimulai setelah UC-01 selesai (~340 detik)
    uc02_stock_adjustment: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 250,
      maxVUs: 500,
      stages: STAGES,
      startTime: '340s',
      exec: 'uc02StockAdjustment',
      tags: { scenario: 'UC-02-StockAdjustment' },
    },
    // UC-03 dimulai setelah UC-02 selesai (~680 detik)
    uc03_outbound: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 250,
      maxVUs: 500,
      stages: STAGES,
      startTime: '680s',
      exec: 'uc03Outbound',
      tags: { scenario: 'UC-03-Outbound' },
    },
  },
  thresholds: {
    ...STANDARD_THRESHOLDS,
    // UC-01
    'uc01_inbound_create_duration': ['p(95)<2000'],
    'uc01_inbound_approve_duration': ['p(95)<3000'],
    'uc01_inbound_e2e_duration': ['p(95)<5000'],
    // UC-02
    'uc02_adjustment_duration': ['p(95)<2000'],
    'uc02_dashboard_read_duration': ['p(95)<3000'],
    'uc02_e2e_duration': ['p(95)<5000'],
    // UC-03
    'uc03_outbound_create_duration': ['p(95)<2000'],
    'uc03_outbound_approve_duration': ['p(95)<5000'],
    'uc03_outbound_e2e_duration': ['p(95)<8000'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'count'],
};

// ─── Setup ───────────────────────────────────────────────────
export function setup() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  WMS LOAD TEST — ALL SCENARIOS (Sequential)     ║');
  console.log('║  UC-01 → UC-02 → UC-03                         ║');
  console.log('║  Estimated total: ~17 minutes                   ║');
  console.log('╚══════════════════════════════════════════════════╝');

  const staffToken = login(STAFF_CREDENTIALS);
  const manajerToken = login(MANAJER_CREDENTIALS);

  if (!staffToken || !manajerToken) {
    throw new Error('Setup gagal: Login tidak berhasil.');
  }

  console.log(`✓ Tokens acquired`);
  console.log(`✓ Base URL: ${BASE_URL}`);

  return { staffToken, manajerToken };
}

// ─── UC-01: Inbound ──────────────────────────────────────────
export function uc01Inbound(data) {
  const { staffToken, manajerToken } = data;
  const e2eStart = Date.now();

  const payload = generateInboundPayload();
  const createStart = Date.now();
  const createRes = http.post(
    `${BASE_URL}/transaksi`,
    JSON.stringify(payload),
    getAuthHeaders(staffToken)
  );
  uc01CreateDuration.add(Date.now() - createStart);

  const transaksiId = extractTransaksiId(createRes);

  if (transaksiId && createRes.status === 201) {
    sleep(0.1);
    const approveStart = Date.now();
    const approveRes = http.put(
      `${BASE_URL}/transaksi/${transaksiId}/approve`,
      null,
      getAuthHeaders(manajerToken)
    );
    uc01ApproveDuration.add(Date.now() - approveStart);

    if (approveRes.status === 200) {
      uc01Success.add(1);
    } else {
      uc01Fail.add(1);
    }
  } else {
    uc01Fail.add(1);
  }

  uc01E2eDuration.add(Date.now() - e2eStart);
  sleep(0.1);
}

// ─── UC-02: Stock Adjustment ─────────────────────────────────
export function uc02StockAdjustment(data) {
  const { staffToken } = data;
  const e2eStart = Date.now();

  const barangId = randomBarangId();
  const payload = generateStockAdjustmentPayload();

  const adjStart = Date.now();
  const adjRes = http.post(
    `${BASE_URL}/barang/${barangId}/stok/tambah`,
    JSON.stringify(payload),
    getAuthHeaders(staffToken)
  );
  uc02AdjDuration.add(Date.now() - adjStart);

  // Dashboard read
  const dashStart = Date.now();
  http.get(`${BASE_URL}/dashboard`, getAuthHeaders(staffToken));
  uc02DashDuration.add(Date.now() - dashStart);

  if (adjRes.status === 200) {
    uc02Success.add(1);
  } else {
    uc02Fail.add(1);
  }

  uc02E2eDuration.add(Date.now() - e2eStart);
  sleep(0.1);
}

// ─── UC-03: Outbound ─────────────────────────────────────────
export function uc03Outbound(data) {
  const { staffToken, manajerToken } = data;
  const e2eStart = Date.now();

  const payload = generateOutboundPayload();

  const createStart = Date.now();
  const createRes = http.post(
    `${BASE_URL}/transaksi`,
    JSON.stringify(payload),
    getAuthHeaders(staffToken)
  );
  uc03CreateDuration.add(Date.now() - createStart);

  const transaksiId = extractTransaksiId(createRes);

  if (transaksiId && createRes.status === 201) {
    sleep(0.1);
    const approveStart = Date.now();
    const approveRes = http.put(
      `${BASE_URL}/transaksi/${transaksiId}/approve`,
      null,
      getAuthHeaders(manajerToken)
    );
    uc03ApproveDuration.add(Date.now() - approveStart);

    if (approveRes.status === 200) {
      uc03Success.add(1);
    } else {
      uc03Fail.add(1);
    }
  } else {
    uc03Fail.add(1);
  }

  uc03E2eDuration.add(Date.now() - e2eStart);
  sleep(0.1);
}

// ─── Teardown ────────────────────────────────────────────────
export function teardown(data) {
  console.log('\n════════════════════════════════════════════════════');
  console.log('  ALL SCENARIOS COMPLETE');
  console.log('════════════════════════════════════════════════════');
  console.log('  UC-01 (Inbound):          uc01_*');
  console.log('  UC-02 (Stock Adjustment): uc02_*');
  console.log('  UC-03 (Outbound):         uc03_*');
  console.log('════════════════════════════════════════════════════\n');
}
