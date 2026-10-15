# QuickNotes Data Model

## 1. Entities and Columns

### Users

Stores registered user accounts.

- `id`: INTEGER, primary key.
- `email`: TEXT, required and unique.
- `password_hash`: TEXT, required; stores a password hash, never a plaintext password.
- `created_at`: TEXT, required; stores the account creation timestamp.

### Notes

Stores notes owned by users.

- `id`: INTEGER, primary key.
- `user_id`: INTEGER, required foreign key referencing `users(id)`.
- `title`: TEXT, required, maximum 100 characters.
- `body`: TEXT, optional.
- `created_at`: TEXT, required.
- `updated_at`: TEXT, required.

### Tags

Stores tags owned by users.

- `id`: INTEGER, primary key.
- `user_id`: INTEGER, required foreign key referencing `users(id)`.
- `name`: TEXT, required.

A user cannot create duplicate tag names under the same account.

### Note_Tags

Connects notes and tags.

- `note_id`: INTEGER, primary key component and foreign key referencing `notes(id)`.
- `tag_id`: INTEGER, primary key component and foreign key referencing `tags(id)`.

The composite primary key prevents the same tag from being attached to the same note more than once.

## 2. CREATE TABLE Statements

The following statements are compatible with SQLite.

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 100),
    body TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE tags (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL CHECK (length(name) > 0),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
    note_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

Foreign key enforcement should be enabled on each SQLite connection.

## 3. Relationships

### One-to-many

One user can own many notes, but each note belongs to one user. The `notes.user_id` foreign key represents this relationship.

One user can also own many tags, but each tag belongs to one user. The `tags.user_id` foreign key represents this relationship.

### Many-to-many

A note can have multiple tags, and a tag can be attached to multiple notes. The `note_tags` join table stores pairs of note IDs and tag IDs to represent this many-to-many relationship.

## 4. Example SQL Queries

### Query 1: Get all notes belonging to one user

```sql
SELECT id, title, body, created_at
FROM notes
WHERE user_id = 1
ORDER BY created_at DESC;
```

### Query 2: Find notes and their tags (JOIN)

```sql
SELECT notes.title, tags.name AS tag_name
FROM notes
JOIN note_tags ON notes.id = note_tags.note_id
JOIN tags ON note_tags.tag_id = tags.id
WHERE notes.user_id = 1
ORDER BY notes.title;
```

### Query 3: Count notes for each user

```sql
SELECT users.email, COUNT(notes.id) AS note_count
FROM users
LEFT JOIN notes ON users.id = notes.user_id
GROUP BY users.id, users.email;
```

### Query 4: Find notes without any tags

```sql
SELECT notes.id, notes.title
FROM notes
LEFT JOIN note_tags ON notes.id = note_tags.note_id
WHERE note_tags.note_id IS NULL;
```

## 5. Indexes

```sql
CREATE INDEX idx_notes_user_created
ON notes(user_id, created_at DESC);
```

This index helps the database retrieve a user's notes in creation-date order without repeatedly scanning and sorting all notes. It supports a common query pattern in QuickNotes.

## 6. SQL or NoSQL?

I would choose a relational SQL database such as PostgreSQL for QuickNotes. Users, notes, tags, and their relationships have clear structures, and foreign keys and unique constraints help protect data integrity. SQL joins make it straightforward to retrieve notes with their tags, while transactions help ensure related changes succeed or fail together. NoSQL could be useful for particular flexible or high-volume workloads, but a relational database fits the core data model and requirements well.
