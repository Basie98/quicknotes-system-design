# QuickNotes System Design

## Overview

QuickNotes is a simple web application that demonstrates how a frontend communicates with a REST API. Users can load notes, create new notes, and delete notes.

The project uses JSONPlaceholder as a demonstration API.

## Features

- Retrieve up to 10 notes from the API.
- Create a note with a required title and optional body.
- Delete a note using its ID.
- Validate note titles to ensure they are not empty and do not exceed 100 characters.
- Display loading, success, error, and empty states.
- Disable buttons while relevant requests are running.
- Display user-provided text safely using `textContent`.

## Technologies

- HTML5
- CSS3
- JavaScript (ES6+)
- Fetch API
- JSONPlaceholder REST API
- Git and GitHub

## Project Structure

```text
quicknotes-system-design/
├── index.html
├── api.js
├── style.css
├── README.md
└── docs/
    ├── api-design.md
    ├── data-model.md
    └── architecture.md
```

## Getting Started

1. Clone or download this repository.
2. Open the project folder.
3. Open `index.html` in a web browser.
4. Click **Load notes** to retrieve notes from the API.
5. Enter a title and optional body to create a note.
6. Click **Delete** beside a note to request its deletion.

An internet connection is required to communicate with JSONPlaceholder.

## API

The application uses the following endpoint:

`https://jsonplaceholder.typicode.com/posts`

- `GET /posts?_limit=10` retrieves up to 10 posts.
- `POST /posts` simulates creating a post.
- `DELETE /posts/{id}` simulates deleting a post.

JSONPlaceholder does not permanently save created posts or deletion changes.

## Documentation

- [API Design](docs/api-design.md)
- [Data Model](docs/data-model.md)
- [System Architecture](docs/architecture.md)

## Limitations

This is a learning project that uses a demonstration API rather than a real backend and database. Notes created or deleted through the API are not permanently stored.

## Future Improvements

- Add a real backend and database.
- Add user authentication.
- Store notes permanently.
- Add automated tests and improve error handling.

## Author

Created as a learning project to practise frontend development, REST API integration, and system design.
