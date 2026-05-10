# Implementation Plan: WMS EDA Migration

This plan outlines the steps to migrate the core transaction approval process to an Event-Driven Architecture (EDA) using Laravel Queues and Redis.

## 1. Infrastructure Setup (Completed)
- [x] Added **Redis** service to `docker-compose.yml`.
- [x] Added **Laravel Worker** service to `docker-compose.yml` with 2 vCPU and 2GB RAM limits.
- [x] Updated `.env` to use `QUEUE_CONNECTION=redis`.

## 2. Code Analysis & Design

### TransaksiService::approve() Decomposition
| Aspect | Current (Sync) | New Design (EDA) | Rationale |
| :--- | :--- | :--- | :--- |
| **Status Validation** | Sync | **Sync** | Prevent processing invalid/duplicate requests. |
| **Initial Status Change** | Sync | **Sync** | Mark as `diterima` (or `processing`) to lock the UI state. |
| **Inventory Update** | Sync | **Async** | Resource intensive, may involve row locks. |
| **Activity Logging** | Sync | **Async** | Non-critical side effect. |
| **PDF Generation** | Partial Async | **Async** | Heavy I/O and CPU usage. |

### New Event & Listeners
- **Event**: `TransactionApproved`
- **Listeners**:
  1. `UpdateInventory` (Queued): Performs `tambahStok` or `kurangiStok`.
  2. `LogApprovalActivity` (Queued): Records the action in `activity_logs`.
  3. `GenerateInvoice` (Queued): Creates the PDF for outbound transactions.

## 3. Implementation Steps

### Step A: Create the Event
Create `app/Modules/Transaction/Events/TransactionApproved.php`.

### Step B: Create the Listeners
1. `app/Modules/Transaction/Listeners/UpdateInventory.php`
2. `app/Modules/Transaction/Listeners/LogApprovalActivity.php`
3. `app/Modules/Transaction/Listeners/GenerateInvoice.php`

### Step C: Register in ServiceProvider
Update `app/Modules/Transaction/TransactionServiceProvider.php` to register events or use `Event::listen` in `EventServiceProvider`.

### Step D: Update TransaksiService
Refactor `approve()` to dispatch the event instead of calling services directly.

## 4. Data Consistency Strategy

To ensure "Stok tidak salah hitung" (Data Consistency) in an asynchronous environment:

1. **Atomic Status Locking**: Use a database transaction in the sync part to change status to `diterima` (locking the record) before dispatching the event.
2. **Idempotency Check**: The `UpdateInventory` listener must check if the transaction has already affected inventory (e.g., check `StockBatch` or `BatchOutflow` records) before proceeding. This prevents double-counting if a job is retried.
3. **Queue Retries**: Use `--tries=3` to handle temporary database locks or transient errors.
4. **Failure Handling**: Implement the `failed()` method in listeners to revert the transaction status to `pending` (or a special `error` status) if the stock update fails permanently (e.g., unexpected stock shortage).
