/**
 * ============================================================
 * UC-03 Outbound Confirmation | Fase 50 RPS
 * ============================================================
 * Skenario paling berat: konfirmasi keluar memicu secara sinkron:
 *   1. FIFO stock deduction
 *   2. BatchOutflow audit trail
 *   3. PDF invoice generation
 *   4. Activity log
 *
 * Perintah:
 *   k6 run --out json=../results/uc03-50rps.json scripts/uc03-outbound-50rps.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

import {
  BASE_URL, STAFF_CREDENTIALS, MANAJER_CREDENTIALS,
  STAGES_50RPS, STANDARD_THRESHOLDS,
  login, getAuthHeaders, generateOutboundPayload, extractTransaksiId,
} from './config.js';

const createDuration  = new Trend('uc03_create_duration', true);
const approveDuration = new Trend('uc03_approve_duration', true);  // PALING BERAT
const verifyDuration  = new Trend('uc03_verify_duration', true);
const e2eDuration     = new Trend('uc03_e2e_duration', true);
const successCount    = new Counter('uc03_success');
const failCount       = new Counter('uc03_fail');
const stokHabis       = new Counter('uc03_stok_habis');   // 422 karena stok kurang
const errorRate       = new Rate('uc03_error_rate');

export const options = {
  scenarios: {
    uc03_50rps: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 200,
      stages: STAGES_50RPS,
      tags: { scenario: 'UC-03-Outbound', phase: '50RPS' },
    },
  },
  thresholds: {
    ...STANDARD_THRESHOLDS,
    'uc03_create_duration':  ['p(95)<2000', 'avg<1000'],
    'uc03_approve_duration': ['p(95)<5000', 'avg<2500'],  // Longgar — ada FIFO+PDF
    'uc03_verify_duration':  ['p(95)<2000', 'avg<1000'],
    'uc03_e2e_duration':     ['p(95)<8000', 'avg<4000'],
    'uc03_error_rate':       ['rate<0.15'],  // Toleran — stok bisa habis
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'count'],
};

export function setup() {
  console.log('┌─────────────────────────────────────────────────┐');
  console.log('│  UC-03 OUTBOUND  │  Fase: 50 RPS  │  90 detik  │');
  console.log('│  (FIFO + PDF + Log — SINKRON)                  │');
  console.log('└─────────────────────────────────────────────────┘');
  const staffToken   = login(STAFF_CREDENTIALS);
  const manajerToken = login(MANAJER_CREDENTIALS);
  if (!staffToken || !manajerToken) throw new Error('Login gagal.');
  console.log(`✓ Tokens OK | URL: ${BASE_URL}`);
  return { staffToken, manajerToken };
}

export default function (data) {
  const { staffToken, manajerToken } = data;
  const e2eStart = Date.now();
  let transaksiId = null;
  let passed = true;

  // Step 1 — Staff buat transaksi keluar
  const t0 = Date.now();
  const createRes = http.post(
    `${BASE_URL}/transaksi`,
    JSON.stringify(generateOutboundPayload()),
    getAuthHeaders(staffToken)
  );
  createDuration.add(Date.now() - t0);

  const created = check(createRes, {
    'UC03 create — 201':     (r) => r.status === 201,
    'UC03 create — pending': (r) => { try { return JSON.parse(r.body).data?.status === 'pending'; } catch { return false; } },
  });

  if (!created) { failCount.add(1); errorRate.add(1); e2eDuration.add(Date.now() - e2eStart); return; }
  transaksiId = extractTransaksiId(createRes);

  // Step 2 — Manajer approve (FIFO + PDF + Log sinkron — operasi TERBERAT)
  if (transaksiId) {
    sleep(0.05);
    const t1 = Date.now();
    const approveRes = http.put(
      `${BASE_URL}/transaksi/${transaksiId}/approve`,
      null,
      getAuthHeaders(manajerToken)
    );
    approveDuration.add(Date.now() - t1);

    if (approveRes.status === 200) {
      check(approveRes, { 'UC03 approve — diterima': (r) => { try { return JSON.parse(r.body).data?.status === 'diterima'; } catch { return false; } } });
    } else if (approveRes.status === 422) {
      // Stok tidak cukup — expected behavior, bukan error sistem
      stokHabis.add(1);
    } else {
      passed = false;
      errorRate.add(1);
    }

    // Step 3 — Verifikasi detail transaksi
    const t2 = Date.now();
    const verifyRes = http.get(`${BASE_URL}/transaksi/${transaksiId}`, getAuthHeaders(staffToken));
    verifyDuration.add(Date.now() - t2);
    check(verifyRes, { 'UC03 verify — 200': (r) => r.status === 200 });
  }

  e2eDuration.add(Date.now() - e2eStart);
  passed ? (successCount.add(1), errorRate.add(0)) : failCount.add(1);
  sleep(0.05);
}

export function teardown() {
  console.log('✓ UC-03 | 50 RPS — Selesai. Cek hasil di: results/uc03-50rps.json');
}
