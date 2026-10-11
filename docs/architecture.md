# QuickNotes — Production System Architecture

## 1. Overview

QuickNotes is a note-taking application that allows users to register, create notes, update and delete notes, and organise notes using tags.

This document proposes a production architecture designed to support up to 1 million registered users. The design focuses on scalability, security, availability, performance, and data integrity.

The figures in this document are planning estimates, not measured production results. Actual infrastructure requirements must be validated through load testing and monitoring.

## 2. Assumptions and Workload Estimates

The initial capacity model uses the following assumptions:

- Registered users: 1,000,000.
- Daily active users: 10% of registered users.
- Daily active users: 100,000.
- Average API requests per active user: 50 per day.
- Total daily API requests: 5,000,000.
- Average month: 30 days.
- Year: 365 days.
- Peak traffic: five times the average request rate.
- Average stored note text: 2 KB.
- Average database overhead per note, including row and index overhead: approximately 1 KB.
- Average notes created per active user: 2 per day.

These assumptions are used to create a starting capacity plan. Real user behaviour, note sizes, query patterns, and growth rates may differ.

## 3. Read and Write Throughput Estimates

### 3.1 Daily API requests

Daily requests:

100,000 active users × 50 requests per user = 5,000,000 requests per day.

Average requests per second:

5,000,000 ÷ 86,400 ≈ 58 requests per second.

Using a peak multiplier of five:

58 × 5 ≈ 290 requests per second.

The system should therefore be load-tested initially for approximately 300 API requests per second, with additional headroom for unexpected traffic.

### 3.2 Read throughput

Assume 90% of API requests are reads, including loading notes, retrieving individual notes, searching, and listing tags.

- Daily read requests: 4,500,000.
- Average read throughput: approximately 52 requests per second.
- Estimated peak read throughput: approximately 260 requests per second.

### 3.3 Write throughput

Assume 10% of API requests are writes, including creating, updating, and deleting notes or tags.

- Daily write requests: 500,000.
- Average write throughput: approximately 5.8 requests per second.
- Estimated peak write throughput: approximately 29 requests per second.

These figures represent API requests, not individual SQL statements. A single API request may execute multiple database queries.

The read/write ratio and peak multiplier must be validated using realistic load tests.

## 4. Yearly Storage Projection

### 4.1 Notes created each year

Assume each of the 100,000 daily active users creates two notes per day.

Daily notes created:

100,000 × 2 = 200,000 notes.

Yearly notes created:

200,000 × 365 = 73,000,000 notes.

### 4.2 Estimated database storage

Assume each note consumes approximately 3 KB of database storage, including 2 KB of text and 1 KB of estimated row and index overhead.

73,000,000 notes × 3 KB = 219,000,000 KB.

This is approximately 219 GB per year using decimal storage units.

| Storage component | Annual estimate |
|---|---:|
| Note text | 146 GB |
| Estimated row and index overhead | 73 GB |
| Total note storage | 219 GB |

This projection excludes database replicas, backups, logs, temporary files, user profile data, tags, and operational overhead.

For planning, the primary database should reserve additional capacity beyond the projected note data. Actual storage usage must be measured against the chosen PostgreSQL schema and indexes.

### 4.3 Storage growth and retention

If note creation remains constant, the database would accumulate approximately 219 GB of note-related storage per year under these assumptions.

Capacity planning should account for:

- Growth in registered and active users.
- Growth in average note size.
- Additional indexes and metadata.
- Replication and backup retention.
- Temporary space required for maintenance and database operations.

Monitoring should alert the engineering team before available storage becomes critically low.

## 5. High-Level Infrastructure Topology

The proposed request path is:

```text
Users / Web Browsers
        |
        v
      DNS
        |
        v
      CDN
        |
        v
Web Application / Static Assets
        |
        v
WAF and HTTPS Load Balancer
        |
        v
+---------------------------+
| Application Instances     |
| API Server 1               |
| API Server 2               |
| API Server 3               |
| Additional autoscaled      |
| instances as required      |
+---------------------------+
        |
        +--------------------+
        |                    |
        v                    v
   Cache Cluster         Worker Queue
        |                    |
        |                    v
        |               Background Workers
        |                    |
        +----------+---------+
                   |
                   v
          PostgreSQL Primary
                   |
          +--------+--------+
          |                 |
          v                 v
   Read Replica 1     Read Replica 2
```

The cache and worker queue are supporting services. The application must remain correct when cached entries expire or background jobs are retried.

## 6. Infrastructure Components

### 6.1 DNS

DNS maps the public application and API domains to the appropriate edge or load-balancing services.

Responsibilities include:

- Resolving the application domain.
- Supporting managed DNS availability.
- Providing routing changes during infrastructure migrations.
- Supporting health-aware routing where the DNS provider offers it.

DNS is not a replacement for application health checks or load balancing.

### 6.2 Content Delivery Network (CDN)

The CDN serves static assets such as CSS, JavaScript, fonts, and images from edge locations close to users.

Benefits include:

- Lower latency for static content.
- Reduced load on the origin infrastructure.
- Better performance for geographically distributed users.

Private notes and authenticated API responses must not be publicly cached. CDN caching rules must protect user-specific data.

### 6.3 Web Application Firewall and Load Balancer

A web application firewall (WAF) helps filter malicious traffic and common web attacks.

The HTTPS load balancer distributes incoming API requests across healthy application instances.

Responsibilities include:

- TLS termination or secure TLS forwarding.
- Health checks.
- Traffic distribution.
- Request size and timeout limits.
- Rate limiting in conjunction with appropriate edge or application controls.

The load balancer should route traffic only to healthy instances.

### 6.4 Multiple Application Instances

The API runs across multiple application instances instead of relying on a single server.

Instances should be distributed across availability zones where supported. They should be replaceable and stateless so that failed instances can be restarted without losing application state.

Responsibilities include:

- Authenticating users.
- Validating requests.
- Checking note and tag ownership.
- Applying business rules.
- Reading and writing data.
- Publishing background jobs when appropriate.

Capacity can be increased by adding application instances. Autoscaling policies should consider CPU usage, memory, request latency, and request queue depth.

### 6.5 PostgreSQL Primary Database

The PostgreSQL primary database handles authoritative writes, including note creation, updates, and deletion.

It maintains relational integrity using primary keys, foreign keys, transactions, and indexes.

Production safeguards should include:

- Automated backups.
- Point-in-time recovery where supported.
- Encryption at rest.
- Restricted network access.
- Database connection pooling.
- Monitoring and alerting.
- Tested recovery procedures.

Database writes must be committed successfully before the API reports that a change has been saved.

### 6.6 Read Replicas

PostgreSQL read replicas can serve selected read-only queries and reduce read traffic to the primary database.

Potential replica workloads include:

- Listing notes.
- Retrieving note details.
- Listing tags.
- Search operations where replica consistency is acceptable.

Writes remain on the primary database.

Replication can be delayed, so a recently updated note may not appear immediately when read from a replica. Requests requiring read-after-write consistency should use the primary or another consistency-aware strategy.

Read replicas are not substitutes for backups.

### 6.7 Cache Cluster

A distributed cache such as Redis can reduce repeated database queries.

Potential uses include:

- Short-lived cached note lists.
- Frequently accessed metadata.
- Rate-limit counters.
- Temporary application data.

Private cached entries must be isolated by user identity and permissions. Cache invalidation must occur when notes or tags change.

The database remains the source of truth. If the cache fails, the application should fall back to the database where possible.

### 6.8 Worker Queue and Background Workers

A queue allows time-consuming tasks to run outside the immediate API request.

Possible background jobs include:

- Sending account and security emails.
- Processing exports.
- Running scheduled maintenance tasks.
- Performing non-urgent cleanup.
- Generating usage reports.

The API publishes a job to the queue, and a worker processes it.

Workers should use retries with backoff, dead-letter handling for repeatedly failing jobs, and idempotent processing to avoid duplicate side effects.

Core note creation and updates should not be reported as successful until the authoritative database transaction has committed.

## 7. Request Flow

### 7.1 Reading notes

1. The user opens QuickNotes in a browser.
2. DNS resolves the application domain.
3. The CDN serves static assets where applicable.
4. The browser sends an HTTPS request to the API.
5. The load balancer routes the request to a healthy application instance.
6. The application validates authentication and note ownership.
7. The application checks the cache where appropriate.
8. If the required data is not cached, the application queries PostgreSQL or a suitable read replica.
9. The API returns a JSON response to the browser.
10. The application may cache eligible data for subsequent requests.

### 7.2 Creating a note

1. The user submits the note form.
2. The browser sends a POST request with a JSON payload.
3. The load balancer routes the request to an application instance.
4. The application validates the token, title, body, and any tag assignments.
5. The application writes the note and its tag relationships to the PostgreSQL primary in a transaction.
6. PostgreSQL commits the transaction.
7. The application invalidates or refreshes affected cache entries.
8. The API returns `201 Created` with the saved note.
9. Any suitable asynchronous tasks are placed on the worker queue.

If the database transaction fails, the API must return an appropriate error instead of claiming that the note was saved.

### 7.3 Deleting a note

1. The browser sends a DELETE request.
2. The application authenticates the user.
3. The application verifies ownership of the note.
4. The application deletes the note from the PostgreSQL primary.
5. Related tag associations are removed through the database relationship rules.
6. Relevant cache entries are invalidated.
7. The API returns `204 No Content` after successful deletion.

## 8. Security Architecture

Security must be applied at every layer.

- Use HTTPS for all public traffic.
- Store passwords using a recognised password-hashing algorithm.
- Validate authentication tokens and enforce authorization on every protected request.
- Enforce user ownership in application queries.
- Use parameterized SQL queries.
- Keep database services on private networks.
- Restrict database credentials and application permissions.
- Store secrets in a managed secret store or secure deployment configuration.
- Apply rate limits to login, registration, and resource-intensive endpoints.
- Encrypt backups and protect access to them.
- Record security events without logging passwords, access tokens, or private note contents unnecessarily.

The application must not rely on the frontend alone to enforce access controls.

## 9. Availability, Failure Handling, and Recovery

The architecture reduces single points of failure by using multiple application instances and managed infrastructure services where appropriate.

Recommended controls include:

- Health checks and automated instance replacement.
- Deployment across multiple availability zones where available.
- Automated database backups and recovery testing.
- Database replication and documented failover procedures.
- Queue retries and dead-letter handling.
- Timeouts and bounded retries for dependent services.
- Monitoring of API latency, error rates, database connections, storage, and queue depth.
- Alerts for failed backups, replication lag, and low storage capacity.

Database failover procedures must account for data consistency and the possibility of brief service interruption.

## 10. Observability and Monitoring

The engineering team should collect metrics and logs that help detect problems before users are seriously affected.

Important metrics include:

- API requests per second.
- Read and write request rates.
- API response times, including p95 and p99 latency.
- HTTP error rates.
- Application CPU and memory.
- Database CPU, connections, slow queries, and storage usage.
- Cache hit ratio and eviction rate.
- Replica lag.
- Queue depth and job processing time.
- Backup success and recovery readiness.

Dashboards and alerts should be based on service objectives and tested failure scenarios.

## 11. Scaling Strategy

### Phase 1: Initial production deployment

- Deploy multiple application instances.
- Use a managed PostgreSQL primary database.
- Configure automated backups and monitoring.
- Introduce connection pooling and essential indexes.
- Use a CDN for static content.

### Phase 2: Increased traffic

- Autoscale application instances.
- Introduce a distributed cache for suitable workloads.
- Add read replicas for eligible read traffic.
- Add worker queues for asynchronous processing.
- Review database query plans and index usage.

### Phase 3: Further growth

- Perform regular load and stress tests.
- Optimise queries and data access patterns.
- Increase database and cache capacity as measured demand requires.
- Consider table partitioning only if data volume and workload justify it.
- Evaluate regional deployment requirements and disaster recovery objectives.

Scaling decisions should be based on observed bottlenecks rather than registered-user count alone.

## 12. Assumptions, Trade-offs, and Limitations

### Assumptions

- One million registered users.
- 100,000 daily active users.
- Fifty API requests per active user per day.
- A 90% read and 10% write request mix.
- Peak traffic is five times the average.
- Two new notes per active user per day.
- Approximately 3 KB of database storage per note, including estimated row and index overhead.

### Trade-offs

**Caching:** Improves read performance but adds invalidation complexity and can serve stale data if implemented incorrectly.

**Read replicas:** Increase read capacity but introduce replication lag and additional operating cost.

**Multiple application instances:** Improve availability and scaling but require centralised configuration, health checks, and deployment management.

**Worker queues:** Improve responsiveness for background work but introduce eventual completion, retries, and duplicate-processing risks.

**PostgreSQL:** Provides strong relational integrity and transactions but requires capacity planning, monitoring, backups, and maintenance.

**CDN:** Reduces static-content latency but must be configured carefully to prevent private data from being cached publicly.

### Limitations

The throughput and storage numbers are estimates, not measured benchmarks. They do not prove that a particular server size or database configuration will meet production service objectives.

Load testing, workload analysis, and capacity testing are required before selecting final instance sizes, replica counts, storage tiers, and autoscaling thresholds.

## 13. Conclusion

This architecture provides a production-oriented starting point for QuickNotes at a target scale of 1 million registered users.

It combines a CDN, secure load balancing, horizontally scalable application instances, PostgreSQL, read replicas, caching, and background workers. The design also includes capacity estimates, security controls, recovery planning, monitoring, and scaling phases.

The final infrastructure configuration should be validated using realistic workloads and updated as production metrics become available.