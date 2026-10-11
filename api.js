const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.querySelector("#load-btn");
const statusMessage = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitButton = document.querySelector("#submit-btn");

function showStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = type;
}

function renderNote(note) {
    const listItem = document.createElement("li");

    const title = document.createElement("h3");
    title.textContent = note.title || "(Untitled note)";

    const body = document.createElement("p");
    body.textContent = note.body || "(No body provided)";

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.type = "button";
    deleteButton.addEventListener("click", () => deleteNote(note.id, listItem));

    listItem.append(title, body, deleteButton);
    return listItem;
}

function showEmptyState() {
    notesList.replaceChildren();

    const item = document.createElement("li");
    item.textContent = "No notes found. Create your first note!";
    notesList.appendChild(item);
}

async function request(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
        return { data: null, status: response.status };
    }

    const data = await response.json();

    return { data, status: response.status };
}

async function loadNotes() {
    loadButton.disabled = true;
    showStatus("Loading notes...");

    try {
        const result = await request(`${API_URL}?_limit=10`);
        notesList.replaceChildren();

        if (result.data.length === 0) {
            showEmptyState();
            showStatus("No notes found.", "success");
            return;
        }

        result.data.forEach((note) => {
            notesList.appendChild(renderNote(note));
        });

        showStatus(`Loaded ${result.data.length} notes from the server.`, "success");
    } catch (error) {
        showStatus("Sorry, we couldn't load your notes. Please try again.", "error");
        console.error("Load notes error:", error);
    } finally {
        loadButton.disabled = false;
    }
}

async function createNote(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    if (!title) {
        showStatus("Please enter a note title.", "error");
        titleInput.focus();
        return;
    }

    if (title.length > 100) {
        showStatus("The title must be 100 characters or fewer.", "error");
        titleInput.focus();
        return;
    }

    submitButton.disabled = true;
    showStatus("Creating note...");

    try {
        const result = await request(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title,
                body,
                userId: 1
            })
        });

        notesList.querySelector('[data-empty-state="true"]')?.remove();

        // JSONPlaceholder simulates creation; it does not permanently store the note.
        notesList.prepend(renderNote(result.data));

        if (notesList.children.length === 1 && result.data.body === "") {
            // The list already contains the new note, so no extra action is needed.
        }

        showStatus(
            `Note created (status ${result.status}, id ${result.data.id}).`,
            "success"
        );

        noteForm.reset();
    } catch (error) {
        showStatus("Sorry, we couldn't create your note. Please try again.", "error");
        console.error("Create note error:", error);
    } finally {
        submitButton.disabled = false;
    }
}

async function deleteNote(id, listItem) {
    const deleteButton = listItem.querySelector("button");
    deleteButton.disabled = true;
    showStatus("Deleting note...");

    try {
        // JSONPlaceholder simulates deletion; it does not permanently change server data.
        const result = await request(`${API_URL}/${encodeURIComponent(id)}`, {
            method: "DELETE"
        });

        listItem.remove();

        if (notesList.children.length === 0) {
            showEmptyState();
        }

        showStatus(`Note deleted (status ${result.status}).`, "success");
    } catch (error) {
        deleteButton.disabled = false;
        showStatus("Sorry, we couldn't delete this note. Please try again.", "error");
        console.error("Delete note error:", error);
    }
}

loadButton.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);