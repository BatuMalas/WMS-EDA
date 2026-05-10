/**
 * ============================================================
 * UC-03: Outbound Confirmation Load Test
 * ============================================================
 * Skenario:
 *   Mengetes kecepatan respons saat konfirmasi pengeluaran barang
 *   yang melibatkan pengiriman notifikasi/peringatan secara sinkron
 *   (FIFO stock deduction + PDF invoice generation + activity log).
 *
 * Alur per VU (Virtual User):
 *   1. Login staff → buat transaksi keluar (POST /api/transaksi)
 *   2. Login manajer → approve transaksi keluar (PUT /api/transaksi/{id}/approve)
 *      → Pada approve, sistem secara sinkron:
 *        a. Mengurangi stok dari batch tertua (FIFO/FEFO)
 *        b. Membuat BatchOutflow records (audit trail)
 *        c. Generate invoice PDF keluar
 *        d. Menulis activity log
 *   3. Verifikasi detail transaksi (GET /api/transaksi/{id})
 *
 * Beban:
 *   50 RPS → 100 RPS → 200 RPS (bertahap)
 *
 * Metrik:
 *   - Custom: uc03_outbound_create_duration
 *   - Custom: uc03_outbound_approve_duration (ini yang paling berat!)
 *   - Custom: uc03_outbound_verify_duration
 *   - Custom: uc03_outbound_e2e_duration
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
  generateOutboundPayload,
  checkCreated,
  extractTransaksiId,
} from './config.js';

// ─── Custom Metrics ──────────────────────────────────────────
const createDuration = new Trend('uc03_outbound_create_duration', true);
const approveDuration = new Trend('uc03_outbound_approve_duration', true);
const verifyDuration = new Trend('uc03_outbound_verify_duration', true);
const e2eDuration = new Trend('uc03_outbound_e2e_duration', true);
const successCount = new Counter('uc03_success_count');
const failCount = new Counter('uc03_fail_count');
const errorRate = new Rate('uc03_error_rate');

// Counter untuk tracking approve failures (stok habis, dll)
const approveFailStok = new Counter('uc03_approve_fail_stok');
const invoiceGenerated = new Counter('uc03_invoice_generated');

// ─── k6 Options ──────────────────────────────────────────────
export const options = {
  scenarios: {
    uc03_outbound: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 250,
      maxVUs: 500,
      stages: LOAD_STAGES,
      tags: { scenario: 'UC-03-Outbound' },
    },
  },
  thresholds: {
    ...STANDARD_THRESHOLDS,
    'uc03_outbound_create_duration': ['p(95)<2000', 'avg<1000'],
    'uc03_outbound_approve_duration': ['p(95)<5000', 'avg<2500'],  // Lebih longgar karena generate PDF
    'uc03_outbound_verify_duration': ['p(95)<2000', 'avg<1000'],
    'uc03_outbound_e2e_duration': ['p(95)<8000', 'avg<4000'],
    'uc03_error_rate': ['rate<0.15'],  // Sedikit lebih toleran karena stok bisa habis
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'count'],
};

// ─── Setup ───────────────────────────────────────────────────
export function setup() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  UC-03: OUTBOUND CONFIRMATION LOAD TEST         ║');
  console.log('║  Target: Create + Approve keluar (FIFO + PDF)   ║');
  console.log('╚══════════════════════════════════════════════════╝');

  const staffToken = login(STAFF_CREDENTIALS);
  const manajerToken = login(MANAJER_CREDENTIALS);

  if (!staffToken || !manajerToken) {
    throw new Error('Setup gagal: Login staff atau manajer tidak berhasil.');
  }

  // Pre-check: pastikan ada stok yang cukup
  const stokRes = http.get(`${BASE_URL}/transaksi/stok-barang`, getAuthHeaders(staffToken));
  if (stokRes.status === 200) {
    try {
      const body = JSON.parse(stokRes.body);
      const totalStok = body.data
        ? body.data.reduce((sum, item) => sum + (item.stok_saat_ini || 0), 0)
        : 0;
      console.log(`✓ Total stok tersedia: ${totalStok} unit`);

      if (totalStok < 100) {
        console.warn('⚠ Stok sangat rendah! Beberapa approve mungkin gagal karena stok tidak cukup.');
      }
    } catch (e) {
      console.warn('⚠ Tidak bisa membaca total stok');
    }
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
  let transaksiId = null;

  // ── Step 1: Staff membuat transaksi keluar ──
  group('UC-03 Step 1: Create Outbound Transaction', () => {
    const payload = generateOutboundPayload();

    const createStart = Date.now();
    const createRes = http.post(
      `${BASE_URL}/transaksi`,
      JSON.stringify(payload),
      getAuthHeaders(staffToken)
    );
    const createElapsed = Date.now() - createStart;
    createDuration.add(createElapsed);

    const created = check(createRes, {
      'Create outbound - status 201': (r) => r.status === 201,
      'Create outbound - has data.id': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.id;
        } catch (e) {
          return false;
        }
      },
      'Create outbound - jenis keluar': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.jenis === 'keluar';
        } catch (e) {
          return false;
        }
      },
      'Create outbound - status pending': (r) => {
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

    transaksiId = extractTransaksiId(createRes);
  });

  // ── Step 2: Manajer approve transaksi keluar ──
  // Ini adalah operasi PALING BERAT karena secara sinkron:
  //   - FIFO stock deduction
  //   - BatchOutflow audit trail
  //   - PDF invoice generation
  //   - Activity log
  if (transaksiId) {
    group('UC-03 Step 2: Approve Outbound (FIFO + PDF + Log)', () => {
      sleep(0.1);

      const approveStart = Date.now();
      const approveRes = http.put(
        `${BASE_URL}/transaksi/${transaksiId}/approve`,
        null,
        getAuthHeaders(manajerToken)
      );
      const approveElapsed = Date.now() - approveStart;
      approveDuration.add(approveElapsed);

      const approved = check(approveRes, {
        'Approve outbound - status 200': (r) => r.status === 200,
      });

      if (approved) {
        // Cek apakah berhasil approved atau gagal karena stok
        const body = JSON.parse(approveRes.body);

        if (body.data && body.data.status === 'diterima') {
          // Sukses approve
          check(approveRes, {
            'Approve outbound - invoice generated': (r) => {
              try {
                const b = JSON.parse(r.body);
                return b.data && b.data.invoice_generated;
              } catch (e) {
                return false;
              }
            },
          });
          invoiceGenerated.add(1);
        }
      } else {
        // Bisa gagal karena stok tidak cukup (expected behavior)
        if (approveRes.status === 422) {
          approveFailStok.add(1);
        } else {
          passed = false;
        }
      }
    });

    // ── Step 3: Verifikasi detail transaksi ──
    group('UC-03 Step 3: Verify Transaction Detail', () => {
      const verifyStart = Date.now();
      const verifyRes = http.get(
        `${BASE_URL}/transaksi/${transaksiId}`,
        getAuthHeaders(staffToken)
      );
      const verifyElapsed = Date.now() - verifyStart;
      verifyDuration.add(verifyElapsed);

      check(verifyRes, {
        'Verify outbound - status 200': (r) => r.status === 200,
        'Verify outbound - has transaction data': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.data && body.data.id === transaksiId;
          } catch (e) {
            return false;
          }
        },
      });
    });
  }

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
  console.log('  UC-03: OUTBOUND CONFIRMATION — TEST COMPLETE');
  console.log('════════════════════════════════════════════════════');
  console.log('Metrik kunci:');
  console.log('  → uc03_outbound_create_duration   (latency create)');
  console.log('  → uc03_outbound_approve_duration  (latency approve — HEAVIEST)');
  console.log('  → uc03_outbound_verify_duration   (latency verify)');
  console.log('  → uc03_outbound_e2e_duration      (end-to-end)');
  console.log('  → uc03_approve_fail_stok           (gagal karena stok habis)');
  console.log('  → uc03_invoice_generated            (invoice PDF berhasil)');
  console.log('════════════════════════════════════════════════════\n');
}
