/**
 * ============================================================
 * UC-02 Stock Adjustment | Fase 100 RPS
 * ============================================================
 * Perintah:
 *   k6 run --out json=../results/uc02-100rps.json scripts/uc02-stock-100rps.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

import {
  BASE_URL, STAFF_CREDENTIALS,
  STAGES_100RPS, STANDARD_THRESHOLDS,
  login, getAuthHeaders, generateStockAdjustmentPayload, randomBarangId,
} from './config.js';

const adjDuration  = new Trend('uc02_adjustment_duration', true);
const dashDuration = new Trend('uc02_dashboard_duration', true);
const e2eDuration  = new Trend('uc02_e2e_duration', true);
const successCount = new Counter('uc02_success');
const failCount    = new Counter('uc02_fail');
const errorRate    = new Rate('uc02_error_rate');

export const options = {
  scenarios: {
    uc02_100rps: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 200,
      maxVUs: 350,
      stages: STAGES_100RPS,
      tags: { scenario: 'UC-02-StockAdj', phase: '100RPS' },
    },
  },
  thresholds: {
    ...STANDARD_THRESHOLDS,
    'uc02_adjustment_duration': ['p(95)<2000', 'avg<1000'],
    'uc02_dashboard_duration':  ['p(95)<3000', 'avg<1500'],
    'uc02_e2e_duration':        ['p(95)<5000', 'avg<2500'],
    'uc02_error_rate':          ['rate<0.10'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'count'],
};

export function setup() {
  console.log('┌─────────────────────────────────────────────────┐');
  console.log('│  UC-02 STOCK ADJ │  Fase: 100 RPS │  90 detik  │');
  console.log('└─────────────────────────────────────────────────┘');
  const staffToken = login(STAFF_CREDENTIALS);
  if (!staffToken) throw new Error('Login gagal.');
  console.log(`✓ Staff token OK | URL: ${BASE_URL}`);
  return { staffToken };
}

export default function (data) {
  const { staffToken } = data;
  const e2eStart = Date.now();

  const barangId = randomBarangId();
  const t0 = Date.now();
  const adjRes = http.post(
    `${BASE_URL}/barang/${barangId}/stok/tambah`,
    JSON.stringify(generateStockAdjustmentPayload()),
    getAuthHeaders(staffToken)
  );
  adjDuration.add(Date.now() - t0);

  const success = check(adjRes, {
    'UC02 adj — 200':       (r) => r.status === 200,
    'UC02 adj — stok_baru': (r) => { try { return JSON.parse(r.body).data?.stok_baru !== undefined; } catch { return false; } },
  });

  if (!success) { failCount.add(1); errorRate.add(1); e2eDuration.add(Date.now() - e2eStart); return; }

  const t1 = Date.now();
  const dashRes = http.get(`${BASE_URL}/dashboard`, getAuthHeaders(staffToken));
  dashDuration.add(Date.now() - t1);
  check(dashRes, { 'UC02 dashboard — 200': (r) => r.status === 200 });

  e2eDuration.add(Date.now() - e2eStart);
  successCount.add(1);
  errorRate.add(0);
  sleep(0.05);
}

export function teardown() {
  console.log('✓ UC-02 | 100 RPS — Selesai. Cek hasil di: results/uc02-100rps.json');
}
