"""
## Treasura
The link to the project is located [here](https://github.com/Akhenaten-Sama/treasura.git)

# To start 

- run "docker compose up --build".

# To run tests
- run "npm run tests"

# Swagger Documentation:
- All routes are documented using Swagger for easy API exploration and testing.

- All routes are documented by swagger

- http://localhost:3000/api/docs#/


# Schemas:
-  schemas  are defined and documented in Swagger below .
"""
### Edge Cases Considered in API Endpoints

- **Invalid Input Handling**: Validated all inputs to ensure they meet required formats and constraints, trimmed parameters.

- **Rate Limiting**: Implemented rate limiting to prevent abuse of the APIs.
- **Pagination and Limits**: Handled large datasets with proper pagination and maximum limits.

- **Concurrency Issues**: Addressed potential race conditions in concurrent API calls by allowing uo to 20 concurrent connections
- **Error Responses**: Provided meaningful error messages and appropriate HTTP status codes.
- **Data Consistency**: Ensured data integrity during partial failures or retries with row locking and rollbacks.

- **Edge Case Scenarios**: Tested scenarios like empty datasets, and unexpected input types.


- **Idempotency**: Ensured repeated requests (e.g., retries) do not cause unintended side effects.

### . Queues for Transaction APIs and Batching
- **Job Queues**: Employed queues to handle transaction APIs and batch transaction lists efficiently with Bull.
- **Job ID Generation**: Returned a unique job ID upon request submission.
- **Result Querying**: Allowed clients to query the job results using the provided job ID.
- **Asynchronous Processing**: Ensured non-blocking operations by processing transactions in the background.


# Ensuring Low Latency, Idempotency, Atomicity, and Safe Concurrent Withdrawals

## Steps Taken

### 1. Low Latency
- **Optimized Queries**: Used indexed columns
- **Caching**: Implemented caching mechanisms (Redis) for frequently accessed data like transactions and wallet reads
- **Connection Pooling**: Configured database connection pooling to reduce connection overhead.

- **Asynchronous Processing**: Leveraged queues

### . Idempotency
- **Unique Request Identifiers**: Generated unique request IDs to track and prevent duplicate operations.
- **Idempotent Endpoints**: Designed APIs to handle repeated requests without side effects.

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

- **Retry Logic**: Implemented retry mechanisms for failed transactions due to deadlocks.



### . Caching
- **Read-Through Cache**: Implemented read-through caching to reduce database load.
- **Cache Invalidation**: Ensured proper cache invalidation strategies to maintain consistency.
