# QuickNotes System Architecture

## 1. Functional Requirements

- Users can register and authenticate securely.
- Authenticated users can create, read, update, and delete their notes.
- Users can organise notes with tags.
- Users can list and search their own notes.
- The API validates input and returns appropriate HTTP status codes.
- The service prevents users from accessing other users' private notes.

## 2. Non-Functional Requirements

- **Scalability:** Add application servers to handle increased traffic.
- **Availability:** Avoid relying on a single application server or database instance.
- **Performance:** Cache suitable reads and keep API responses reasonably fast.
- **Security:** Use HTTPS, authentication, authorisation, input validation, and parameterised queries.
- **Durability:** Back up the database and monitor backup recovery.
- **Observability:** Collect logs, metrics, traces, and alerts.
- **Consistency:** Keep writes on the primary database and account for replication lag on read replicas.

## 3. Load Estimates for One Million Users

### Assumptions

- There are 1,000,000 registered users.
- 10% are active daily, giving 100,000 daily active users.
- Each active user performs 50 note reads per day.
- Each active user creates one note per day.
- Activity is spread evenly across 86,400 seconds per day.
- Peak traffic is estimated at five times average traffic.
- Each new note consumes approximately 1 KB of stored text and metadata, excluding indexes, replicas, and backups.
- Estimates count logical note reads and writes, not every internal database operation.

### Reads per second

Daily reads:

100,000 × 50 = 5,000,000 reads per day.

Average reads per second:

5,000,000 ÷ 86,400 ≈ **57.9 reads per second**.

Estimated peak reads:

57.9 × 5 ≈ **289 reads per second**.

### Writes per second

Daily note creations:

100,000 × 1 = 100,000 writes per day.

Average writes per second:

100,000 ÷ 86,400 ≈ **1.16 writes per second**.

Estimated peak writes:

1.16 × 5 ≈ **5.8 writes per second**.

These estimates include note creations only. Updates, deletes, authentication, tag changes, and other requests would increase actual load.

### Storage per year

Annual new notes:

100,000 × 365 = 36,500,000 notes.

At approximately 1 KB per note:

36,500,000 × 1 KB = 36,500,000 KB, or about **36.5 GB per year** of raw note data and assumed metadata.

This is a simplified estimate. Indexes, backups, replication, and additional fields increase storage requirements.

## 4. Architecture Diagram

```text
                        +----------------+
                        |     Client     |
                        | Browser / App  |
                        +----------------+
                                |
                                v
                        +----------------+
                        |      DNS       |
                        | Domain lookup  |
                        +----------------+
                                |
                                v
                        +----------------+
                        |      CDN       |
                        | Static assets  |
                        +----------------+
                                |
                                v
                        +----------------+
                        | Load Balancer  |
                        +----------------+
                           /          \
                          v            v
                  +-------------+ +-------------+
                  | App Server 1| | App Server 2|
                  +-------------+ +-------------+
                          \            /
                           \          /
                     +--------------------+
                     | Cache              |
                     | Frequently read    |
                     | notes / metadata   |
                     +--------------------+
                                |
                     +----------+----------+
                     |                     |
                     v                     v
              +---------------+    +---------------+
              | Primary DB    |--->| Read Replica  |
              | Writes        |    | Read queries  |
              +---------------+    +---------------+
                     |
                     | Async jobs
                     v
              +---------------+
              | Queue         |
              +---------------+
                     |
                     v
              +---------------+
              | Worker        |
              | Background    |
              | tasks         |
              +---------------+
```

The CDN primarily serves static front-end assets; private note data should not be cached publicly. The cache should use user-scoped keys and appropriate expiration rules.

## 5. Components and the Problems They Solve

- **Client:** Provides the user interface for creating, viewing, updating, and deleting notes.
- **DNS:** Resolves the service's domain name to the appropriate network endpoint.
- **CDN:** Delivers static assets close to users, reducing latency and load on the origin servers.
- **Load balancer:** Distributes API requests across healthy application servers.
- **Application servers:** Validate requests, enforce authentication and ownership rules, execute business logic, and return API responses.
- **Cache:** Reduces repeated database reads for frequently requested data, using user-scoped keys to prevent data leakage.
- **Primary database:** Stores the authoritative user, note, and tag data and handles writes.
- **Read replica:** Serves eligible read queries to reduce primary database load, with the limitation that replication may lag.
- **Queue:** Holds background jobs so request handlers do not need to wait for slower asynchronous work.
- **Worker:** Processes queued tasks such as notifications, cleanup, or other background jobs independently of user requests.

## 6. GET /notes Request Flow

1. The client sends `GET /api/v1/notes` over HTTPS with its authentication credentials.
2. DNS resolves the service domain, and the request reaches the load balancer.
3. The load balancer forwards the request to a healthy application server.
4. The application server authenticates the user and validates pagination parameters.
5. The server checks the cache using a key scoped to that user and the requested page.
6. If a suitable cached result exists, the server returns it after confirming access rules.
7. On a cache miss, the server queries the read replica when appropriate, or the primary database when fresh data is required.
8. The server stores suitable results in the cache with a defined expiry and returns a JSON response.
9. The client displays the notes and an appropriate success or empty-state message.

## 7. POST /notes Request Flow

1. The client sends `POST /api/v1/notes` with a JSON title and optional body over HTTPS.
2. DNS resolves the domain, and the load balancer forwards the request to a healthy application server.
3. The application server authenticates the user and validates the title, body, and request format.
4. The server derives the owner ID from the authenticated identity rather than trusting a client-supplied owner ID.
5. The server inserts the note into the primary database using a parameterised query and commits the transaction.
6. The server invalidates or updates relevant cached note-list entries for that user.
7. If a background task is required, the server publishes a job to the queue; the job can be retried if processing fails.
8. The API returns `201 Created` with the new note's ID and representation.

## 8. Trade-Offs

### Cache speed versus freshness

Caching reduces repeated database reads and improves response time, but cached notes may be stale after an update or delete. Use expiry times and invalidate or update affected user-scoped cache entries after successful writes.

### Read replicas versus consistency

Read replicas allow read traffic to scale independently, but replication lag may cause newly created or updated notes to appear late. Use the primary database for operations that require read-after-write consistency.

### More application servers versus operational complexity

Multiple servers improve capacity and resilience, but require health checks, monitoring, deployment coordination, and careful handling of shared state. Keep session or request state out of individual servers where practical.

### Asynchronous jobs versus immediate completion

Queues keep slow background work out of the request path, but jobs may be delayed or delivered more than once. Workers should be idempotent, monitored, and able to retry failed jobs.

## 9. Avoiding Single Points of Failure

- Run at least two application servers across separate failure domains and use load-balancer health checks.
- Deploy redundant load-balancer and DNS arrangements through a managed provider or a highly available configuration.
- Use managed database high availability or a standby primary with tested failover; a read replica alone is not a complete backup or failover strategy.
- Use a durable, replicated queue and workers that can restart or be replaced.
- Use a highly available cache configuration and treat cache loss as a recoverable event rather than permanent data loss.
- Back up the database, test restores, and monitor service health and capacity.

## 10. Conclusion

QuickNotes can start with a simple API and a relational database, then scale using multiple application servers, caching, read replicas, and asynchronous workers. The estimates provide a starting point for capacity planning; real monitoring data and load tests should guide production sizing.
