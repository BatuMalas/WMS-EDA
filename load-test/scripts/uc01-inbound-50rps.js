/**
 * ============================================================
 * UC-01 Inbound | Fase 50 RPS
 * ============================================================
 * Pengujian terisolasi untuk pengumpulan data Bab IV.
 * Jalankan secara terpisah agar metrik tidak tercampur.
 *
 * Perintah:
 *   k6 run --out json=../results/uc01-50rps.json scripts/uc01-inbound-50rps.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

import {
  BASE_URL,
  STAFF_CREDENTIALS,
  MANAJER_CREDENTIALS,
  STAGES_50RPS,
  STANDARD_THRESHOLDS,
  login,
  getAuthHeaders,
  generateInboundPayload,
  extractTransaksiId,
} from './config.js';

// ─── Custom Metrics ──────────────────────────────────────────
const createDuration  = new Trend('uc01_create_duration', true);
const approveDuration = new Trend('uc01_approve_duration', true);
const e2eDuration     = new Trend('uc01_e2e_duration', true);
const successCount    = new Counter('uc01_success');
const failCount       = new Counter('uc01_fail');
const errorRate       = new Rate('uc01_error_rate');

// ─── k6 Options ──────────────────────────────────────────────
export const options = {
  scenarios: {
    uc01_50rps: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 200,
      maxVUs: 600,
      stages: STAGES_50RPS,
      tags: { scenario: 'UC-01-Inbound', phase: '50RPS' },
    },
  },
  // Timeout lebih panjang: operasi approve (FIFO+log) bisa butuh waktu lama
  httpDebug: '',
  insecureSkipTLSVerify: true,
  thresholds: {
    ...STANDARD_THRESHOLDS,
    'uc01_create_duration':  ['p(95)<30000', 'avg<15000'],
    'uc01_approve_duration': ['p(95)<45000', 'avg<20000'],
    'uc01_e2e_duration':     ['p(95)<60000', 'avg<30000'],
    'uc01_error_rate':       ['rate<0.30'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'count'],
};

export function setup() {
  console.log('┌─────────────────────────────────────────────────┐');
  console.log('│  UC-01 INBOUND  │  Fase: 50 RPS  │  90 detik   │');
  console.log('└─────────────────────────────────────────────────┘');
  const staffToken   = login(STAFF_CREDENTIALS);
  const manajerToken = login(MANAJER_CREDENTIALS);
  if (!staffToken || !manajerToken) {
    throw new Error('Login gagal — pastikan seeder sudah dijalankan dan backend berjalan di port 8000.');
  }
  console.log(`✓ Staff token    : OK`);
  console.log(`✓ Manajer token  : OK`);
  console.log(`✓ Base URL       : ${BASE_URL}`);
  return { staffToken, manajerToken };
}

export default function (data) {
  const { staffToken, manajerToken } = data;
  const e2eStart = Date.now();
  let passed = true;

  // Step 1 — Staff buat transaksi masuk
  const payload   = generateInboundPayload();
  const t0        = Date.now();
  const createRes = http.post(
    `${BASE_URL}/transaksi`,
    JSON.stringify(payload),
    getAuthHeaders(staffToken)
  );
  createDuration.add(Date.now() - t0);

  const created = check(createRes, {
    'UC01 create — 201': (r) => r.status === 201,
    'UC01 create — id':  (r) => { try { return JSON.parse(r.body).data?.id; } catch { return false; } },
  });

  if (!created) {
    failCount.add(1);
    errorRate.add(1);
    e2eDuration.add(Date.now() - e2eStart);
    return;
  }

  const transaksiId = extractTransaksiId(createRes);

  // Step 2 — Manajer approve (memicu update stok sinkron)
  if (transaksiId) {
    sleep(0.05);
    const t1         = Date.now();
    const approveRes = http.put(
      `${BASE_URL}/transaksi/${transaksiId}/approve`,
      null,
      getAuthHeaders(manajerToken)
    );
    approveDuration.add(Date.now() - t1);

    const approved = check(approveRes, {
      'UC01 approve — 200':      (r) => r.status === 200,
      'UC01 approve — diterima': (r) => { try { return JSON.parse(r.body).data?.status === 'diterima'; } catch { return false; } },
    });

    if (!approved) passed = false;
  }

  e2eDuration.add(Date.now() - e2eStart);
  if (passed) { successCount.add(1); errorRate.add(0); }
  else        { failCount.add(1); }
  sleep(0.05);
}

export function teardown() {
  console.log('✓ UC-01 | 50 RPS — Selesai. Cek hasil di: results/uc01-50rps.json');
}
