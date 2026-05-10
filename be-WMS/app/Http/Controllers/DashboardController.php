<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use App\Modules\Shared\Contracts\CustomerServiceInterface;
use App\Modules\Shared\Contracts\InventoryServiceInterface;
use App\Modules\Shared\Contracts\SupplierServiceInterface;
use App\Modules\Shared\Contracts\TransactionServiceInterface;
use App\Modules\Shared\Traits\ApiResponse;

class DashboardController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected InventoryServiceInterface $inventoryService,
        protected SupplierServiceInterface $supplierService,
        protected TransactionServiceInterface $transactionService,
        protected CustomerServiceInterface $customerService
    ) {}

    public function index(\Illuminate\Http\Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $inventorySummary = $this->inventoryService->getSummary();
        $supplierSummary = $this->supplierService->getSummary();
        $transactionSummary = $this->transactionService->getSummary();
        $customerSummary = $this->customerService->getSummary();

        return $this->success([
            // ─── Existing Data ───
            'total_barang' => $inventorySummary['total_barang'],
            'total_stok' => $inventorySummary['total_stok'],
            'total_supplier' => $supplierSummary['total_supplier'],
            'total_customer' => $customerSummary['total_customer'],
            'total_users' => User::count(),
            'transaksi_masuk_hari_ini' => $transactionSummary['transaksi_masuk_hari_ini'],
            'transaksi_keluar_hari_ini' => $transactionSummary['transaksi_keluar_hari_ini'],
            'total_transaksi_hari_ini' => $transactionSummary['total_transaksi_hari_ini'],
            'pending_count' => $transactionSummary['pending_count'],
            'latest_transaksi' => $transactionSummary['latest_transaksi'],

            // ─── New: Asset & Low Stock ───
            'total_nilai_aset' => $this->inventoryService->getAssetValue(),
            'low_stock_count' => $inventorySummary['low_stock_count'],
            'low_stock_items' => $this->inventoryService->getLowStockItems(10),

            // ─── New: Charts Data ───
            'inventory_flow_monthly' => $this->transactionService->getMonthlyFlow(6),
            'top_moving_products' => $this->transactionService->getTopMovingProducts(10),
            'stock_by_kategori' => $this->inventoryService->getStockByKategori(),

            // ─── New: Supplier Ranking ───
            'top_suppliers' => $this->supplierService->getTopSuppliers(5),

            // ─── New: Stock Mutations ───
            'recent_mutations' => $this->transactionService->getRecentMutations(10, $startDate, $endDate),

            // ─── New: Activity Log ───
            'recent_activities' => ActivityLog::with('user:id,name,role')
                ->when($startDate, fn($q) => $q->whereDate('created_at', '>=', $startDate))
                ->when($endDate, fn($q) => $q->whereDate('created_at', '<=', $endDate))
                ->latest()
                ->limit(10)
                ->get()
                ->map(fn($a) => [
                    'id' => $a->id,
                    'user' => $a->user?->name ?? 'System',
                    'role' => $a->user?->role ?? '-',
                    'action' => $a->action,
                    'module' => $a->module,
                    'description' => $a->description,
                    'created_at' => $a->created_at->format('Y-m-d H:i'),
                ]),
        ]);
    }
}
