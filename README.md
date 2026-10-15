# QuickNotes System Design

## Description

QuickNotes System Design is a learning project that demonstrates how a browser-based note-taking application can communicate with an API and how a backend service could be designed to support one million registered users.

The front end uses HTML, CSS, and JavaScript to load, create, and delete practice notes through the JSONPlaceholder API. The documentation describes a proposed production REST API, relational database model, and scalable system architecture.

**Important:** JSONPlaceholder is a mock API. Create and delete requests demonstrate the API workflow but do not permanently change the server's stored posts.

## Features

- Load up to 10 notes from an API.
- Create notes with a required title and optional body.
- Delete notes from the current page after a successful API response.
- Display loading, success, error, and empty states.
- Validate note titles and disable relevant buttons during requests.
- Use a reusable asynchronous request function.
- Document REST endpoints, database relationships, and scaling trade-offs.

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Fetch API
- JSONPlaceholder
- SQL and SQLite
- Markdown
- Git and GitHub

## How to Run the API Client

1. Clone the repository:

   ```bash
   git clone https://github.com/YOUR-USERNAME/quicknotes-system-design.git
   ```

2. Enter the project folder:

   ```bash
   cd quicknotes-system-design
   ```

3. Open the folder in Visual Studio Code.

4. Open `index.html` with the Live Server extension, or serve the folder using another local HTTP server.

5. Click **Load notes** to retrieve the practice notes. Use the form to test creating notes and each note's Delete button to test deletion.

An internet connection is required to reach JSONPlaceholder.

Replace `YOUR-USERNAME` in the clone command with your GitHub username after creating the repository.

## Documentation

- [API Design](docs/api-design.md) — REST endpoints, request and response examples, and error codes.
- [Data Model](docs/data-model.md) — database entities, keys, relationships, SQL queries, and indexes.
- [Architecture](docs/architecture.md) — requirements, capacity estimates, architecture diagram, request flows, and trade-offs.

## What I Learned

- How to use `fetch()`, `async/await`, and reusable request functions to communicate with an API.
- Why HTTP response status checks and clear loading, success, error, and empty states are important.
- How to validate form input and safely display user or API text using `textContent`.
- How RESTful endpoints map HTTP methods to creating, reading, updating, and deleting resources.
- How primary keys, foreign keys, and join tables model relationships in a relational database.
- How caches, read replicas, load balancers, queues, and workers can support a growing application.
- How Git commits and GitHub help track and share software projects.

## Project Limitations

The front end uses JSONPlaceholder rather than a real QuickNotes backend. The proposed API and architecture are design documents and are not a deployed production service. The client does not provide persistent storage or real account authentication.

## Author

Created as a software engineering and system design learning project.
