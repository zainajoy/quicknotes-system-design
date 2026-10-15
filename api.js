
// JSONPlaceholder is a practice API; it does not permanently save new posts.
const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.querySelector("#load-btn");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitButton = document.querySelector("#submit-btn");
const statusMessage = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");

let notes = [];
let isLoading = false;
let isSubmitting = false;
const deletingIds = new Set();

// Show status messages with the correct styling.
function showStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.classList.remove("success", "error");

    if (type) {
        statusMessage.classList.add(type);
    }
}

// Reusable request function for GET, POST, and DELETE.
async function request(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        const error = new Error(
            `Request failed with status ${response.status}`
        );
        error.status = response.status;
        throw error;
    }

    // DELETE may return 204 No Content, which has no JSON body.
    if (response.status === 204) {
        return { data: null, status: response.status };
    }

    const data = await response.json();

    return {
        data: data,
        status: response.status
    };
}

// Update buttons based on requests currently running.
function updateButtons() {
    loadButton.disabled = isLoading;
    submitButton.disabled = isSubmitting;

    document.querySelectorAll(".delete-btn").forEach(function (button) {
        const id = Number(button.dataset.id);
        button.disabled = deletingIds.has(id);
    });
}

// Draw a note using safe DOM methods.
function createNoteCard(note) {
    const item = document.createElement("li");
    item.classList.add("note-card");

    const title = document.createElement("h3");
    title.textContent = note.title || "(Untitled note)";

    const body = document.createElement("p");
    body.classList.add("note-body");
    body.textContent = note.body || "No body provided.";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.classList.add("delete-btn");
    deleteButton.dataset.id = String(note.id);
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", function () {
        deleteNote(note.id);
    });

    item.appendChild(title);
    item.appendChild(body);
    item.appendChild(deleteButton);

    return item;
}

// Display the notes stored in the client.
function renderNotes() {
    notesList.textContent = "";

    if (notes.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.classList.add("empty-state");
        emptyMessage.textContent =
            "No notes to display. Select Load notes or create a note.";
        notesList.appendChild(emptyMessage);
        return;
    }

    notes.forEach(function (note) {
        notesList.appendChild(createNoteCard(note));
    });

    updateButtons();
}

// GET: load 10 notes from the practice API.
async function loadNotes() {
    if (isLoading) return;

    isLoading = true;
    updateButtons();
    showStatus("Loading notes...");

    try {
        const result = await request(`${API_URL}?_limit=10`);
        notes = result.data;

        renderNotes();

        if (notes.length === 0) {
            showStatus("The server returned no notes.", "success");
        } else {
            showStatus(
                `Loaded ${notes.length} notes from the server.`,
                "success"
            );
        }
    } catch (error) {
        console.error("Could not load notes:", error);
        showStatus(
            "Sorry, we could not load notes. Check your connection and try again.",
            "error"
        );
    } finally {
        isLoading = false;
        updateButtons();
    }
}

// POST: create a note on the practice API.
async function createNote(title, body) {
    if (isSubmitting) return;

    isSubmitting = true;
    updateButtons();
    showStatus("Creating note...");

    try {
        const result = await request(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title,
                body: body,
                userId: 1
            })
        });

        const createdNote = result.data;

        // JSONPlaceholder simulates creation but does not persist the post.
        // Keep the returned note in this page's local array for the demo.
        notes.unshift(createdNote);
        renderNotes();

        showStatus(
            `Note created (status ${result.status}, id ${createdNote.id}).`,
            "success"
        );

        noteForm.reset();
    } catch (error) {
        console.error("Could not create note:", error);
        showStatus(
            "Sorry, the note could not be created. Please try again.",
            "error"
        );
    } finally {
        isSubmitting = false;
        updateButtons();
    }
}

// DELETE: request deletion and remove the note from this page.
async function deleteNote(id) {
    if (deletingIds.has(Number(id))) return;

    deletingIds.add(Number(id));
    updateButtons();
    showStatus("Deleting note...");

    try {
        const result = await request(`${API_URL}/${encodeURIComponent(id)}`, {
            method: "DELETE"
        });

        // JSONPlaceholder simulates DELETE without changing its stored data.
        // Remove the note from this page's array to demonstrate the UI flow.
        notes = notes.filter(function (note) {
            return Number(note.id) !== Number(id);
        });

        renderNotes();
        showStatus(
            `Note deleted (status ${result.status}, id ${id}).`,
            "success"
        );
    } catch (error) {
        console.error("Could not delete note:", error);
        showStatus(
            `Sorry, note ${id} could not be deleted. Please try again.`,
            "error"
        );
    } finally {
        deletingIds.delete(Number(id));
        updateButtons();
    }
}

// Load notes when the user clicks the button.
loadButton.addEventListener("click", loadNotes);

// Validate and submit the form.
noteForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    if (title.length === 0) {
        showStatus("Please enter a title for your note.", "error");
        titleInput.focus();
        return;
    }

    if (title.length > 100) {
        showStatus("The title must be 100 characters or fewer.", "error");
        titleInput.focus();
        return;
    }

    createNote(title, body);
});

// Show the initial empty state.
renderNotes();
