/**
 * ============================================================
 * UC-02: Stock Adjustment Load Test
 * ============================================================
 * Skenario:
 *   Mengetes perubahan stok dalam jumlah intensif dan dampaknya
 *   terhadap pembaruan data rekap di dashboard secara langsung.
 *
 * Alur per VU (Virtual User):
 *   1. Tambah stok ke barang random (POST /api/barang/{id}/stok/tambah)
 *   2. Baca dashboard untuk verifikasi update (GET /api/dashboard)
 *   3. Baca stok barang summary (GET /api/transaksi/stok-barang)
 *
 * Beban:
 *   50 RPS → 100 RPS → 200 RPS (bertahap)
 *
 * Metrik:
 *   - http_req_duration (latency mean & p95)
 *   - http_reqs (throughput)
 *   - http_req_failed (error rate)
 *   - Custom: uc02_adjustment_duration
 *   - Custom: uc02_dashboard_read_duration
 *   - Custom: uc02_e2e_duration
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

import {
  BASE_URL,
  STAFF_CREDENTIALS,
  LOAD_STAGES,
  STANDARD_THRESHOLDS,
  login,
  getAuthHeaders,
  generateStockAdjustmentPayload,
  randomBarangId,
  checkSuccess,
} from './config.js';

// ─── Custom Metrics ──────────────────────────────────────────
const adjustmentDuration = new Trend('uc02_adjustment_duration', true);
const dashboardReadDuration = new Trend('uc02_dashboard_read_duration', true);
const stokBarangDuration = new Trend('uc02_stok_barang_duration', true);
const e2eDuration = new Trend('uc02_e2e_duration', true);
const successCount = new Counter('uc02_success_count');
const failCount = new Counter('uc02_fail_count');
const errorRate = new Rate('uc02_error_rate');

// ─── k6 Options ──────────────────────────────────────────────
export const options = {
  scenarios: {
    uc02_stock_adjustment: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 250,
      maxVUs: 500,
      stages: LOAD_STAGES,
      tags: { scenario: 'UC-02-StockAdjustment' },
    },
  },
  thresholds: {
    ...STANDARD_THRESHOLDS,
    'uc02_adjustment_duration': ['p(95)<2000', 'avg<1000'],
    'uc02_dashboard_read_duration': ['p(95)<3000', 'avg<1500'],
    'uc02_stok_barang_duration': ['p(95)<3000', 'avg<1500'],
    'uc02_e2e_duration': ['p(95)<5000', 'avg<2500'],
    'uc02_error_rate': ['rate<0.10'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'count'],
};

// ─── Setup ───────────────────────────────────────────────────
export function setup() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  UC-02: STOCK ADJUSTMENT LOAD TEST              ║');
  console.log('║  Target: Tambah stok + Dashboard read           ║');
  console.log('╚══════════════════════════════════════════════════╝');

  const staffToken = login(STAFF_CREDENTIALS);

  if (!staffToken) {
    throw new Error('Setup gagal: Login staff tidak berhasil.');
  }

  console.log(`✓ Staff token acquired`);
  console.log(`✓ Base URL: ${BASE_URL}`);

  return { staffToken };
}

// ─── Main Test Function ──────────────────────────────────────
export default function (data) {
  const { staffToken } = data;
  const e2eStart = Date.now();
  let passed = true;

  const barangId = randomBarangId();

  // ── Step 1: Tambah stok (Stock Adjustment) ──
  group('UC-02 Step 1: Stock Adjustment (Tambah Stok)', () => {
    const payload = generateStockAdjustmentPayload();

    const adjStart = Date.now();
    const adjRes = http.post(
      `${BASE_URL}/barang/${barangId}/stok/tambah`,
      JSON.stringify(payload),
      getAuthHeaders(staffToken)
    );
    const adjElapsed = Date.now() - adjStart;
    adjustmentDuration.add(adjElapsed);

    const success = check(adjRes, {
      'Stock adjustment - status 200': (r) => r.status === 200,
      'Stock adjustment - has stok_baru': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.stok_baru !== undefined;
        } catch (e) {
          return false;
        }
      },
      'Stock adjustment - batch created': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.batch && body.data.batch.id;
        } catch (e) {
          return false;
        }
      },
    });

    if (!success) {
      passed = false;
      failCount.add(1);
      errorRate.add(1);
      return;
    }
  });

  // ── Step 2: Baca Dashboard (verifikasi update langsung) ──
  group('UC-02 Step 2: Dashboard Read (Verify Update)', () => {
    const dashStart = Date.now();
    const dashRes = http.get(
      `${BASE_URL}/dashboard`,
      getAuthHeaders(staffToken)
    );
    const dashElapsed = Date.now() - dashStart;
    dashboardReadDuration.add(dashElapsed);

    check(dashRes, {
      'Dashboard read - status 200': (r) => r.status === 200,
      'Dashboard read - has inventory data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.inventory;
        } catch (e) {
          return false;
        }
      },
    });
  });

  // ── Step 3: Baca stok barang summary ──
  group('UC-02 Step 3: Stock Summary Read', () => {
    const stokStart = Date.now();
    const stokRes = http.get(
      `${BASE_URL}/transaksi/stok-barang`,
      getAuthHeaders(staffToken)
    );
    const stokElapsed = Date.now() - stokStart;
    stokBarangDuration.add(stokElapsed);

    check(stokRes, {
      'Stock summary - status 200': (r) => r.status === 200,
      'Stock summary - has data array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && Array.isArray(body.data);
        } catch (e) {
          return false;
        }
      },
    });
  });

  // ── Record metrics ──
  const e2eElapsed = Date.now() - e2eStart;
  e2eDuration.add(e2eElapsed);

  if (passed) {
    successCount.add(1);
    errorRate.add(0);
  }

  sleep(0.1);
}

// ─── Teardown ────────────────────────────────────────────────
export function teardown(data) {
  console.log('\n════════════════════════════════════════════════════');
  console.log('  UC-02: STOCK ADJUSTMENT — TEST COMPLETE');
  console.log('════════════════════════════════════════════════════');
  console.log('Metrik kunci:');
  console.log('  → uc02_adjustment_duration      (latency adjustment)');
  console.log('  → uc02_dashboard_read_duration   (latency dashboard)');
  console.log('  → uc02_stok_barang_duration      (latency stok summary)');
  console.log('  → uc02_e2e_duration              (end-to-end)');
  console.log('  → uc02_success_count / uc02_fail_count');
  console.log('════════════════════════════════════════════════════\n');
}
