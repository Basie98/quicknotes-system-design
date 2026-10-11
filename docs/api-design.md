# QuickNotes — Production API Design

## 1. Overview

The QuickNotes API allows users to create accounts, sign in, create and manage notes, and organise notes using tags.

The API follows REST principles and uses HTTPS to protect data in transit. JSON is used for request and response bodies.

**Base URL:** `https://api.quicknotes.example.com/v1`

The domain above is a placeholder for the production domain.

### General conventions

- HTTP methods describe the action being performed.
- JSON request and response bodies use `Content-Type: application/json`.
- Authentication uses a bearer access token.
- Every endpoint that accesses private data must verify the authenticated user's permissions.
- Timestamps use ISO 8601 format in UTC.
- List endpoints support pagination.
- The API enforces a maximum note title length of 100 characters.

## 2. Authentication

Authenticated requests must include:

```http
Authorization: Bearer <access_token>
```

The server validates the token and identifies the user making the request. Clients must never be allowed to select another user's identity by supplying an arbitrary `user_id`.

## 3. REST API Endpoints

### Endpoint 1: Register a user

**Method:** `POST`

**Path:** `/v1/auth/register`

Creates a new user account.

Request:

```json
{
  "full_name": "Thabo Mokoena",
  "email": "thabo@example.com",
  "password": "ExampleStrongPassword123!"
}
```

Successful response: `201 Created`

```json
{
  "user": {
    "user_id": 101,
    "full_name": "Thabo Mokoena",
    "email": "thabo@example.com",
    "created_at": "2026-10-11T10:00:00Z"
  }
}
```

The server hashes the password before storing it. The password and password hash are never returned in the response.

### Endpoint 2: Sign in

**Method:** `POST`

**Path:** `/v1/auth/login`

Authenticates a user and issues an access token.

Request:

```json
{
  "email": "thabo@example.com",
  "password": "ExampleStrongPassword123!"
}
```

Successful response: `200 OK`

```json
{
  "access_token": "<access_token>",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

Invalid credentials return `401 Unauthorized`. Production deployments should use secure token handling, rate limiting, and appropriate refresh-token or reauthentication policies.

### Endpoint 3: Retrieve the current user

**Method:** `GET`

**Path:** `/v1/users/me`

Returns the profile of the authenticated user.

Successful response: `200 OK`

```json
{
  "user_id": 101,
  "full_name": "Thabo Mokoena",
  "email": "thabo@example.com",
  "created_at": "2026-10-11T10:00:00Z"
}
```

This endpoint does not accept a user ID from the client because the identity is obtained from the validated access token.

### Endpoint 4: List notes

**Method:** `GET`

**Path:** `/v1/notes`

Returns notes belonging to the authenticated user.

Example request:

```http
GET /v1/notes?page=1&limit=20
Authorization: Bearer <access_token>
```

Optional query parameters:

- `page`: page number, starting at 1.
- `limit`: number of notes per page, maximum 100.
- `tag_id`: filter notes by a tag.
- `search`: search note titles and bodies.

Successful response: `200 OK`

```json
{
  "data": [
    {
      "note_id": 501,
      "title": "Project planning",
      "body": "Prepare the project schedule.",
      "created_at": "2026-10-11T10:15:00Z",
      "updated_at": "2026-10-11T10:15:00Z",
      "tags": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "total_pages": 1
  }
}
```

The server must filter notes by the authenticated user's identity.

### Endpoint 5: Retrieve one note

**Method:** `GET`

**Path:** `/v1/notes/{note_id}`

Returns a specific note if it belongs to the authenticated user.

Example request:

```http
GET /v1/notes/501
Authorization: Bearer <access_token>
```

Successful response: `200 OK`

```json
{
  "note_id": 501,
  "title": "Project planning",
  "body": "Prepare the project schedule.",
  "created_at": "2026-10-11T10:15:00Z",
  "updated_at": "2026-10-11T10:15:00Z",
  "tags": []
}
```

If the note does not exist or does not belong to the user, the API returns `404 Not Found` to avoid disclosing another user's private records.

### Endpoint 6: Create a note

**Method:** `POST`

**Path:** `/v1/notes`

Creates a note for the authenticated user.

Request:

```json
{
  "title": "Meeting notes",
  "body": "Discuss the project timeline.",
  "tag_ids": [10, 12]
}
```

`tag_ids` is optional. Any supplied tags must belong to the authenticated user.

Successful response: `201 Created`

```json
{
  "note_id": 502,
  "title": "Meeting notes",
  "body": "Discuss the project timeline.",
  "created_at": "2026-10-11T11:00:00Z",
  "updated_at": "2026-10-11T11:00:00Z",
  "tags": [
    {
      "tag_id": 10,
      "name": "Work"
    },
    {
      "tag_id": 12,
      "name": "Projects"
    }
  ]
}
```

The server generates the note ID, assigns ownership from the authenticated user, validates the payload, and saves the note and tag relationships in a database transaction.

### Endpoint 7: Update a note

**Method:** `PATCH`

**Path:** `/v1/notes/{note_id}`

Updates selected fields of a note belonging to the authenticated user.

Request:

```json
{
  "title": "Updated meeting notes",
  "body": "Review the revised project timeline."
}
```

Successful response: `200 OK`

```json
{
  "note_id": 502,
  "title": "Updated meeting notes",
  "body": "Review the revised project timeline.",
  "updated_at": "2026-10-11T11:30:00Z",
  "tags": [
    {
      "tag_id": 10,
      "name": "Work"
    },
    {
      "tag_id": 12,
      "name": "Projects"
    }
  ]
}
```

Only supported fields may be changed. The client cannot change the note's owner or ID. If `tag_ids` is supported in a PATCH request, the server replaces the note's tag associations transactionally after validating ownership.

### Endpoint 8: Delete a note

**Method:** `DELETE`

**Path:** `/v1/notes/{note_id}`

Deletes a note belonging to the authenticated user.

Example request:

```http
DELETE /v1/notes/502
Authorization: Bearer <access_token>
```

Successful response: `204 No Content`

The response has no JSON body. Related rows in `note_tags` are removed through the database foreign-key cascade.

Deleting a note must not delete another user's note.

### Endpoint 9: List tags

**Method:** `GET`

**Path:** `/v1/tags`

Returns tags belonging to the authenticated user.

Successful response: `200 OK`

```json
{
  "data": [
    {
      "tag_id": 10,
      "name": "Work"
    },
    {
      "tag_id": 12,
      "name": "Projects"
    }
  ]
}
```

The server returns only tags owned by the authenticated user.

### Endpoint 10: Create a tag

**Method:** `POST`

**Path:** `/v1/tags`

Creates a tag for the authenticated user.

Request:

```json
{
  "name": "Personal"
}
```

Successful response: `201 Created`

```json
{
  "tag_id": 13,
  "name": "Personal",
  "created_at": "2026-10-11T11:45:00Z"
}
```

Tag names must not exceed 50 characters. Duplicate tag names for the same user return `409 Conflict`.

### Endpoint 11: Delete a tag

**Method:** `DELETE`

**Path:** `/v1/tags/{tag_id}`

Deletes a tag belonging to the authenticated user.

Successful response: `204 No Content`

The tag's associations in `note_tags` are deleted through the foreign-key cascade. The notes themselves remain.

## 4. Standard Error Responses

The API uses standard HTTP status codes to communicate the outcome of requests.

| Status | Meaning | Example |
|---|---|---|
| `400 Bad Request` | Invalid request data | Missing title or malformed JSON |
| `401 Unauthorized` | Missing, expired, or invalid authentication | Invalid access token |
| `403 Forbidden` | Authenticated user is not permitted to perform an action | Attempt to access a restricted administrative function |
| `404 Not Found` | Requested resource does not exist or is not visible to the user | Missing note |
| `409 Conflict` | Request conflicts with existing data | Duplicate email or tag name |
| `422 Unprocessable Content` | Request is syntactically valid but fails validation | Title exceeds the permitted length |
| `429 Too Many Requests` | Rate limit exceeded | Too many login attempts |
| `500 Internal Server Error` | Unexpected server failure | Unhandled application error |
| `503 Service Unavailable` | Service temporarily unavailable | Database service unavailable |

### Standard error body

Error responses use a consistent JSON structure where a response body is appropriate.

Example: `400 Bad Request`

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The note title is required.",
    "details": [
      {
        "field": "title",
        "issue": "This field cannot be empty."
      }
    ],
    "request_id": "req-example-123"
  }
}
```

The `details` field may be omitted when it is not relevant. Error responses must not expose passwords, access tokens, database credentials, SQL statements, or internal stack traces.

A `204 No Content` response does not contain a response body.

## 5. Validation Rules

The API validates all incoming data on the server, even when the frontend performs the same checks.

- User email addresses must be valid and unique.
- Passwords must meet the configured security policy.
- Note titles are required and limited to 100 characters.
- Note bodies may be empty but must meet configured size limits.
- Tag names are required and limited to 50 characters.
- Pagination values must be within allowed ranges.
- Resource IDs must have valid formats.
- Tag assignments must refer to tags owned by the authenticated user.
- Unknown or unsupported fields must not be used to override ownership or permissions.

## 6. Security and Authorization

The production API must:

1. Require HTTPS.
2. Validate authentication tokens on protected endpoints.
3. Enforce ownership checks on every note and tag operation.
4. Hash passwords with a recognised password-hashing algorithm.
5. Use parameterized database queries.
6. Apply rate limits to authentication and resource-intensive endpoints.
7. Avoid exposing private records through error messages.
8. Validate and limit request sizes.
9. Store secrets in a secure configuration or secret-management system.
10. Log security-relevant events without logging passwords or access tokens.

Authentication and authorization are different: authentication identifies the user, while authorization determines which resources that user may access.

## 7. Pagination, Performance, and Reliability

List endpoints use pagination to avoid returning every note in one response. A maximum page size of 100 helps limit memory use and response size.

The service should use database connection pooling, query timeouts, request timeouts, and appropriate database indexes.

For high-volume deployments, cursor-based pagination may be introduced for large datasets to reduce the cost of deep offset pagination.

The API should expose health and readiness checks through infrastructure-specific endpoints, with access restricted where necessary. Application logs and metrics should support monitoring of latency, request volume, error rates, and database performance.

## 8. API Versioning

The `/v1` prefix identifies the first version of the API. Breaking changes should be introduced through a new version, such as `/v2`, with a documented migration plan.

Non-breaking additions should preserve existing endpoint behaviour and response compatibility.

## 9. Conclusion

This API specification defines the production interface for QuickNotes, including authentication, user profiles, notes, tags, CRUD operations, JSON payloads, standard errors, and security requirements.

It is a design blueprint, not a claim that these endpoints have already been implemented or deployed. The backend team must implement the routes, database transactions, validation, authorization, monitoring, and operational controls described here.