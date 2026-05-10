<?php
// Test koneksi DB dan ukur waktu per operasi
$start = microtime(true);

// 1. Koneksi PDO
$t0 = microtime(true);
$pdo = new PDO('mysql:host=mysql;port=3306;dbname=wms_db_test', 'root', 'root');
echo sprintf("PDO connect  : %.0f ms\n", (microtime(true) - $t0) * 1000);

// 2. Query simple
$t0 = microtime(true);
$pdo->query('SELECT 1');
echo sprintf("SELECT 1     : %.0f ms\n", (microtime(true) - $t0) * 1000);

// 3. Query users
$t0 = microtime(true);
$stmt = $pdo->prepare('SELECT id, username, password FROM users WHERE username = ?');
$stmt->execute(['petugas1']);
$user = $stmt->fetch(PDO::FETCH_ASSOC);
echo sprintf("User query   : %.0f ms | found: %s\n", (microtime(true) - $t0) * 1000, $user ? 'yes' : 'no');

// 4. Password verify
$t0 = microtime(true);
$ok = password_verify('password', $user['password'] ?? '');
echo sprintf("Hash verify  : %.0f ms | result: %s\n", (microtime(true) - $t0) * 1000, $ok ? 'OK' : 'FAIL');

// 5. Total
echo sprintf("TOTAL        : %.0f ms\n", (microtime(true) - $start) * 1000);
