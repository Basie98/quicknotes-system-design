# QuickNotes System Architecture

## 1. Overview

QuickNotes is a simple web application that allows users to load, create, and delete notes using an API. The application uses HTML to structure the page, CSS to style it, and JavaScript to communicate with the server.

## 2. Architecture Components

### Frontend

The frontend runs in the user's web browser.

- **index.html:** Provides the structure of the application, including the notes list and create-note form.
- **style.css:** Controls the appearance and layout of the application.
- **api.js:** Handles API requests, displays notes, validates user input, and shows loading, success, and error messages.

### External API

The application uses JSONPlaceholder as a sample REST API.

API endpoint:

`https://jsonplaceholder.typicode.com/posts`

The application uses three HTTP methods:

- **GET:** Retrieves notes for display.
- **POST:** Sends a new note to the API.
- **DELETE:** Sends a request to delete a note.

JSONPlaceholder is a testing service. Creating and deleting records are simulated, so changes are not permanently saved on the server.

## 3. Request Flow

### Loading Notes

1. The user clicks the Load notes button.
2. JavaScript sends a GET request to the API.
3. The API returns a JSON response.
4. JavaScript creates HTML elements for each note.
5. The notes appear on the page.
6. If the request fails, an error message is displayed.

### Creating a Note

1. The user enters a title and an optional body.
2. JavaScript checks that the title is not empty and does not exceed 100 characters.
3. JavaScript sends a POST request containing the note data.
4. The API returns a response.
5. The new note is displayed on the page if the request succeeds.

### Deleting a Note

1. The user clicks the Delete button beside a note.
2. JavaScript sends a DELETE request to the API.
3. If the request succeeds, the note is removed from the page.
4. If the request fails, an error message is displayed.

## 4. Error Handling and User Experience

The application provides feedback during API requests.

- Loading messages tell users when data is being retrieved.
- Success messages confirm completed requests.
- Error messages explain when a request fails.
- Buttons are disabled during relevant requests to help prevent duplicate submissions.
- Empty-state messages inform users when no notes are available.

## 5. Security Considerations

- User-provided note titles and bodies are displayed using `textContent` rather than inserting user input as HTML.
- The application validates note titles before sending requests.
- API errors are handled without exposing technical details to the user.
- JSONPlaceholder is used for demonstration purposes and is not a production database.

## 6. Limitations and Future Improvements

The current application relies on an external testing API. Notes are not permanently stored when created or deleted.

Future improvements could include:

- Connecting to a real backend and database.
- Adding user authentication.
- Saving notes permanently.
- Adding automated tests.
- Improving accessibility and request feedback.
