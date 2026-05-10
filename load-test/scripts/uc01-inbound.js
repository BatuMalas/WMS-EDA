/**
 * ============================================================
 * UC-01: Inbound / Receiving Load Test
 * ============================================================
 * Skenario:
 *   Mengetes kinerja sistem saat mencatat barang masuk dan
 *   memperbarui stok sekaligus (create transaksi masuk + approve).
 *
 * Alur per VU (Virtual User):
 *   1. Login sebagai staff → buat transaksi masuk (POST /api/transaksi)
 *   2. Login sebagai manajer → approve transaksi (PUT /api/transaksi/{id}/approve)
 *   3. Verifikasi dashboard ter-update (GET /api/dashboard)
 *
 * Beban:
 *   50 RPS → 100 RPS → 200 RPS (bertahap)
 *
 * Metrik:
 *   - http_req_duration (latency mean & p95)
 *   - http_reqs (throughput)
 *   - http_req_failed (error rate)
 *   - Custom: uc01_inbound_create_duration
 *   - Custom: uc01_inbound_approve_duration
 *   - Custom: uc01_inbound_e2e_duration
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

import {
  BASE_URL,
  STAFF_CREDENTIALS,
  MANAJER_CREDENTIALS,
  LOAD_STAGES,
  STANDARD_THRESHOLDS,
  login,
  getAuthHeaders,
  generateInboundPayload,
  checkSuccess,
  checkCreated,
  extractTransaksiId,
} from './config.js';

// ─── Custom Metrics ──────────────────────────────────────────
const createDuration = new Trend('uc01_inbound_create_duration', true);
const approveDuration = new Trend('uc01_inbound_approve_duration', true);
const e2eDuration = new Trend('uc01_inbound_e2e_duration', true);
const successCount = new Counter('uc01_success_count');
const failCount = new Counter('uc01_fail_count');
const errorRate = new Rate('uc01_error_rate');

// ─── k6 Options ──────────────────────────────────────────────
export const options = {
  scenarios: {
    uc01_inbound: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 250,
      maxVUs: 500,
      stages: LOAD_STAGES,
      tags: { scenario: 'UC-01-Inbound' },
    },
  },
  thresholds: {
    ...STANDARD_THRESHOLDS,
    'uc01_inbound_create_duration': ['p(95)<2000', 'avg<1000'],
    'uc01_inbound_approve_duration': ['p(95)<3000', 'avg<1500'],
    'uc01_inbound_e2e_duration': ['p(95)<5000', 'avg<2500'],
    'uc01_error_rate': ['rate<0.10'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'count'],
};

// ─── Setup: Login sekali, simpan token ───────────────────────
export function setup() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  UC-01: INBOUND / RECEIVING LOAD TEST           ║');
  console.log('║  Target: POST + APPROVE transaksi masuk         ║');
  console.log('╚══════════════════════════════════════════════════╝');

  const staffToken = login(STAFF_CREDENTIALS);
  const manajerToken = login(MANAJER_CREDENTIALS);

  if (!staffToken || !manajerToken) {
    throw new Error('Setup gagal: Login staff atau manajer tidak berhasil. Pastikan seeder sudah dijalankan.');
  }

  console.log(`✓ Staff token acquired`);
  console.log(`✓ Manajer token acquired`);
  console.log(`✓ Base URL: ${BASE_URL}`);

  return { staffToken, manajerToken };
}

// ─── Main Test Function ──────────────────────────────────────
export default function (data) {
  const { staffToken, manajerToken } = data;
  const e2eStart = Date.now();
  let passed = true;

  // ── Step 1: Staff membuat transaksi masuk ──
  group('UC-01 Step 1: Create Inbound Transaction', () => {
    const payload = generateInboundPayload();

    const createStart = Date.now();
    const createRes = http.post(
      `${BASE_URL}/transaksi`,
      JSON.stringify(payload),
      getAuthHeaders(staffToken)
    );
    const createElapsed = Date.now() - createStart;
    createDuration.add(createElapsed);

    const created = check(createRes, {
      'Create inbound - status 201': (r) => r.status === 201,
      'Create inbound - has data.id': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.id;
        } catch (e) {
          return false;
        }
      },
      'Create inbound - status pending': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.status === 'pending';
        } catch (e) {
          return false;
        }
      },
    });

    if (!created) {
      passed = false;
      failCount.add(1);
      errorRate.add(1);
      return;
    }

    const transaksiId = extractTransaksiId(createRes);

    // ── Step 2: Manajer approve transaksi ──
    if (transaksiId) {
      sleep(0.1); // Minimal delay antara create & approve

      const approveStart = Date.now();
      const approveRes = http.put(
        `${BASE_URL}/transaksi/${transaksiId}/approve`,
        null,
        getAuthHeaders(manajerToken)
      );
      const approveElapsed = Date.now() - approveStart;
      approveDuration.add(approveElapsed);

      const approved = check(approveRes, {
        'Approve inbound - status 200': (r) => r.status === 200,
        'Approve inbound - status diterima': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.data && body.data.status === 'diterima';
          } catch (e) {
            return false;
          }
        },
      });

      if (!approved) {
        passed = false;
      }
    }
  });

  // ── Step 3: Verifikasi dashboard (optional read) ──
  group('UC-01 Step 3: Verify Dashboard Update', () => {
    const dashRes = http.get(
      `${BASE_URL}/dashboard`,
      getAuthHeaders(staffToken)
    );

    check(dashRes, {
      'Dashboard accessible - status 200': (r) => r.status === 200,
    });
  });

  // ── Record metrics ──
  const e2eElapsed = Date.now() - e2eStart;
  e2eDuration.add(e2eElapsed);

  if (passed) {
    successCount.add(1);
    errorRate.add(0);
  }

  sleep(0.1); // Breathing room
}

// ─── Teardown ────────────────────────────────────────────────
export function teardown(data) {
  console.log('\n════════════════════════════════════════════════════');
  console.log('  UC-01: INBOUND / RECEIVING — TEST COMPLETE');
  console.log('════════════════════════════════════════════════════');
  console.log('Metrik kunci:');
  console.log('  → uc01_inbound_create_duration  (latency create)');
  console.log('  → uc01_inbound_approve_duration (latency approve)');
  console.log('  → uc01_inbound_e2e_duration     (end-to-end)');
  console.log('  → uc01_success_count / uc01_fail_count');
  console.log('════════════════════════════════════════════════════\n');
}
