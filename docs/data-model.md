# QuickNotes — Production Database Design

## 1. Overview

QuickNotes is a note-taking application designed to support up to 1 million registered users. The database must store user accounts, notes, tags, and the relationships between notes and tags.

This design uses PostgreSQL, a relational database management system, to provide data integrity, reliable transactions, and efficient queries.

## 2. Database Tables

The database contains four main tables:

- **users:** Stores user account information.
- **notes:** Stores notes created by users.
- **tags:** Stores labels that users can apply to notes.
- **note_tags:** Connects notes to tags through a many-to-many relationship.

Each table has a primary key. Foreign keys connect related records and help maintain referential integrity.

## 3. SQL Table Definitions

The following SQL statements create the database tables.

### 3.1 Users Table

```sql
CREATE TABLE users (
    user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Explanation:**

- `user_id` uniquely identifies each user.
- `email` must be unique to prevent duplicate accounts.
- `password_hash` stores a securely hashed password, never a plain-text password.
- `created_at` records when the account was created.
- `updated_at` records the last update; application logic or a database trigger must maintain it.

### 3.2 Notes Table

```sql
CREATE TABLE notes (
    note_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notes_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);
```

**Explanation:**

- `note_id` uniquely identifies each note.
- `user_id` identifies the owner of the note.
- `title` is required and limited to 100 characters.
- `body` stores the note content and may be empty.
- The foreign key ensures every note belongs to an existing user.
- `ON DELETE CASCADE` deletes a user's notes when their account is deleted.

### 3.3 Tags Table

```sql
CREATE TABLE tags (
    tag_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tags_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT unique_user_tag
        UNIQUE (user_id, name)
);
```

**Explanation:**

- `tag_id` uniquely identifies each tag.
- `user_id` identifies the user who owns the tag.
- `name` stores the tag label, such as Work, Personal, or Study.
- The unique constraint prevents a user from creating duplicate tag names.

### 3.4 Note_Tags Table

```sql
CREATE TABLE note_tags (
    note_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,

    PRIMARY KEY (note_id, tag_id),

    CONSTRAINT fk_note_tags_note
        FOREIGN KEY (note_id)
        REFERENCES notes(note_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_note_tags_tag
        FOREIGN KEY (tag_id)
        REFERENCES tags(tag_id)
        ON DELETE CASCADE
);
```

**Explanation:**

The `note_tags` table connects notes and tags. One note can have multiple tags, and one tag can be assigned to multiple notes.

The combined primary key `(note_id, tag_id)` prevents the same tag from being attached to the same note more than once.

The application must also verify that a note and its assigned tag belong to the same user. This prevents users from attaching another user's tags to their notes.

## 4. Relationships Between Tables

The relationships are:

- One user can have many notes.
- One user can have many tags.
- One note can have many tags.
- One tag can belong to many notes.

The `users` table is connected to `notes` and `tags` through foreign keys. The `note_tags` table manages the many-to-many relationship between `notes` and `tags`.

## 5. Example SQL Queries

### 5.1 Retrieve all notes belonging to a user

```sql
SELECT note_id, title, body, created_at
FROM notes
WHERE user_id = 1
ORDER BY updated_at DESC;
```

This query retrieves the notes owned by user 1, displaying the most recently updated notes first.

### 5.2 Retrieve notes with their tags

```sql
SELECT
    n.note_id,
    n.title,
    t.name AS tag_name
FROM notes n
LEFT JOIN note_tags nt
    ON n.note_id = nt.note_id
LEFT JOIN tags t
    ON nt.tag_id = t.tag_id
WHERE n.user_id = 1
ORDER BY n.note_id;
```

This query uses joins to retrieve notes and their associated tags. A `LEFT JOIN` allows notes without tags to appear in the results.

### 5.3 Count notes for each user

```sql
SELECT
    u.user_id,
    u.full_name,
    COUNT(n.note_id) AS total_notes
FROM users u
LEFT JOIN notes n
    ON u.user_id = n.user_id
GROUP BY u.user_id, u.full_name
ORDER BY total_notes DESC;
```

This query counts each user's notes, including users who have not created any notes.

### 5.4 Find notes by tag

```sql
SELECT n.note_id, n.title, t.name AS tag_name
FROM notes n
JOIN note_tags nt
    ON n.note_id = nt.note_id
JOIN tags t
    ON nt.tag_id = t.tag_id
WHERE n.user_id = 1
  AND t.name = 'Work';
```

This query retrieves notes belonging to user 1 that have the `Work` tag.

## 6. Indexing Strategy

Indexes help PostgreSQL find records without scanning every row in a table.

```sql
CREATE INDEX idx_notes_user_updated
    ON notes (user_id, updated_at DESC);

CREATE INDEX idx_tags_user
    ON tags (user_id);

CREATE INDEX idx_note_tags_tag
    ON note_tags (tag_id, note_id);
```

**Index justification:**

- `idx_notes_user_updated` improves queries that retrieve a user's notes in update-date order.
- `idx_tags_user` improves searches for tags owned by a particular user.
- `idx_note_tags_tag` helps retrieve notes associated with a specific tag.

The primary keys and unique constraints automatically create indexes where PostgreSQL requires them. The `note_tags` primary key already indexes `(note_id, tag_id)`, so a separate index on those same columns is unnecessary.

Indexes improve read performance but require additional storage and can slow down writes slightly. Indexes should be reviewed using query plans and real application workload data.

## 7. Database Engine Choice

**Chosen database: PostgreSQL**

PostgreSQL is suitable for QuickNotes because it supports relational data, foreign keys, transactions, constraints, indexing, and complex queries using joins.

It helps maintain consistency when users create notes, assign tags, or delete records. Its mature replication capabilities also support a future architecture with read replicas for distributing read traffic.

For a system with 1 million registered users, PostgreSQL can be deployed on appropriately sized infrastructure with connection pooling, monitoring, automated backups, and read replicas as demand grows.

The number of registered users alone does not determine the required database capacity. Actual active users, request rates, note sizes, query patterns, and growth must be measured to size the infrastructure correctly.

## 8. Data Integrity and Security

The database design supports data integrity through primary keys, foreign keys, unique constraints, and required fields.

Additional production safeguards should include:

- Secure password hashing using a suitable password-hashing algorithm.
- Authentication and authorization for all user-owned records.
- Parameterized SQL queries to reduce SQL injection risk.
- TLS connections and encryption at rest.
- Automated backups and tested recovery procedures.
- Monitoring of query performance, storage capacity, and database availability.
- Application-level validation of note ownership and tag ownership.

## 9. Conclusion

This database design provides a structured foundation for QuickNotes. It separates users, notes, and tags into related tables, uses keys to maintain relationships, and includes example joins and indexes to support efficient queries.

PostgreSQL is a suitable starting point for a production system serving up to 1 million registered users, provided that infrastructure capacity is validated against measured workload and growth requirements.