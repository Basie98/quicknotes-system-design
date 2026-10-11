# QuickNotes Data Model

## 1. Overview

QuickNotes represents each note as a JavaScript object. The application retrieves note objects from JSONPlaceholder and displays them in the browser.

## 2. Note Structure

Each note contains the following fields:

| Field | Data Type | Description |
|---|---|---|
| `id` | Number | Unique identifier for a note |
| `userId` | Number | Identifier of the user associated with the note |
| `title` | String | Short title describing the note |
| `body` | String | Main text of the note |

## 3. Example Note

```json
{
  "userId": 1,
  "id": 1,
  "title": "Buy groceries",
  "body": "Buy milk and bread"
}
```

## 4. Field Rules

- **id:** Provided by the API for existing notes. JSONPlaceholder generates a simulated ID when a note is created.
- **userId:** Set to `1` when the application submits a new note.
- **title:** Required, trimmed of leading and trailing whitespace, and limited to 100 characters.
- **body:** Optional text. If no body is provided, the application displays a message indicating that the note has no body.

## 5. Data Flow

1. The client sends a GET request to retrieve note objects.
2. The API returns a JSON array.
3. JavaScript creates HTML elements to display each note.
4. When a user creates a note, the client sends the title, body, and user ID in a POST request.
5. When a user deletes a note, the client sends a DELETE request using that note's ID.

## 6. Storage and Persistence

JSONPlaceholder is used for demonstration purposes. It simulates creating and deleting posts but does not permanently store those changes. Notes created in the browser may therefore disappear after the page is refreshed and the server data is loaded again.

A production version would use a database to store notes permanently and enforce data integrity on the server.