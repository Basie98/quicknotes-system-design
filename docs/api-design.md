# QuickNotes API Design

## 1. Overview

QuickNotes uses the JSONPlaceholder REST API to demonstrate how a web application communicates with a server. The API returns JSON data and supports retrieving, creating, and deleting posts.

**Base URL:** `https://jsonplaceholder.typicode.com/posts`

## 2. API Endpoints

### GET — Retrieve Notes

**Endpoint:** `GET /posts?_limit=10`

**Purpose:** Retrieves up to 10 posts to display as notes in the application.

**Successful response:** HTTP 200 OK

The response is a JSON array containing note objects. Each object includes an ID, title, body, and user ID.

### POST — Create a Note

**Endpoint:** `POST /posts`

**Purpose:** Sends a new note to the API.

**Request body example:**

```json
{
  "title": "Buy groceries",
  "body": "Buy milk and bread",
  "userId": 1
}
```

**Successful response:** HTTP 201 Created

The response contains the submitted data and a simulated ID.

### DELETE — Delete a Note

**Endpoint:** `DELETE /posts/{id}`

**Purpose:** Requests deletion of the selected note.

**Successful response:** JSONPlaceholder normally returns HTTP 200 OK with a JSON response for this endpoint.

## 3. Data Format

The application sends and receives JSON.

A typical note object contains:

- `id`: Unique identifier for the note.
- `title`: The note title.
- `body`: The note content.
- `userId`: Identifier of the user associated with the note.

## 4. Validation

Before a note is submitted:

- The title must not be empty.
- Leading and trailing whitespace is removed.
- The title must not exceed 100 characters.
- The note body is optional.

## 5. Error Handling

The client checks whether an HTTP response is successful. If a request fails, it displays a user-friendly error message and logs technical details to the browser console.

Loading and submission buttons are disabled while their requests are running to reduce accidental repeated requests.

## 6. Limitations

JSONPlaceholder is a demonstration API. Creating and deleting posts are simulated and do not permanently modify the server's stored data.