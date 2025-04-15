"""
## Treasura

# Swagger Documentation:
- All routes are documented using Swagger for easy API exploration and testing.

- All routes are documented by swagger

- http://localhost:3001/api/docs#/wallets/WalletsController_createWallet


# Schemas:
-  schemas  are defined and documented in Swagger.
"""

### . Queues for Transaction APIs and Batching
- **Job Queues**: Employed queues to handle transaction APIs and batch transaction lists efficiently.
- **Job ID Generation**: Returned a unique job ID upon request submission.
- **Result Querying**: Allowed clients to query the job results using the provided job ID.
- **Asynchronous Processing**: Ensured non-blocking operations by processing transactions in the background.


# Ensuring Low Latency, Idempotency, Atomicity, and Safe Concurrent Withdrawals

## Steps Taken

### 1. Low Latency
- **Optimized Queries**: Used indexed columns and avoided full table scans in database queries.
- **Caching**: Implemented caching mechanisms (Redis) for frequently accessed data.
- **Connection Pooling**: Configured database connection pooling to reduce connection overhead.

- **Asynchronous Processing**: Leveraged asynchronous APIs and background workers for non-critical tasks.

### . Idempotency
- **Unique Request Identifiers**: Generated unique request IDs to track and prevent duplicate operations.
- **Idempotent Endpoints**: Designed APIs to handle repeated requests without side effects.
- **State Validation**: Checked the current state of the resource before performing operations.

### . Ensuring Atomicity
- **Database Transactions**: Wrapped critical operations in database transactions to ensure all-or-nothing execution.
- **Rollback Mechanisms**: Configured rollback procedures for failed transactions.

### . Preventing Overdraws
- **Balance Validation**: Checked account balances before processing withdrawals.
- **Race Condition Prevention**: Used locking mechanisms to prevent simultaneous updates to the same account.

### . Handling Concurrent Withdrawals Safely
- **Row-Level Locking**: Applied row-level locking in MySQL/PostgreSQL to ensure only one transaction modifies a record at a time.

- **Pessimistic Locking**: Locked rows explicitly when high contention was expected.

### . Concurrency and Deadlock Prevention
- **Deadlock Avoidance**: Ordered resource access consistently to prevent circular waits.
- **Timeouts**: Set timeouts for locks to avoid indefinite blocking.
- **Retry Logic**: Implemented retry mechanisms for failed transactions due to deadlocks.



### . Caching
- **Read-Through Cache**: Implemented read-through caching to reduce database load.
- **Cache Invalidation**: Ensured proper cache invalidation strategies to maintain consistency.
