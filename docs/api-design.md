# QuickNotes REST API Design

## Overview

The QuickNotes API allows authenticated users to create, read, update, and delete their notes, as well as organise notes with tags.

**Base URL:** `/api/v1`

**Content type:** `application/json`

## Endpoints

| Method | Path | Description | Success status |
|---|---|---|---|
| GET | `/api/v1/notes` | List the authenticated user's notes, with optional pagination. | 200 OK |
| GET | `/api/v1/notes/{id}` | Retrieve one note owned by the authenticated user. | 200 OK |
| POST | `/api/v1/notes` | Create a new note. | 201 Created |
| PUT | `/api/v1/notes/{id}` | Replace an existing note's editable fields. | 200 OK |
| PATCH | `/api/v1/notes/{id}` | Partially update a note. | 200 OK |
| DELETE | `/api/v1/notes/{id}` | Delete a note owned by the authenticated user. | 204 No Content |
| GET | `/api/v1/tags` | List the authenticated user's tags. | 200 OK |
| POST | `/api/v1/notes/{id}/tags` | Attach an existing tag to a note. | 200 OK |

All note operations require authentication. The server derives the user ID from the authenticated identity rather than trusting a user ID supplied by the client.

## Create a Note

**Request**

`POST /api/v1/notes`

```json
{
  "title": "Study JavaScript",
  "body": "Practise asynchronous requests"
}
```

**Response — 201 Created**

```json
{
  "id": 101,
  "title": "Study JavaScript",
  "body": "Practise asynchronous requests",
  "createdAt": "2026-10-15T10:00:00Z",
  "updatedAt": "2026-10-15T10:00:00Z"
}
```

The title is required and must contain no more than 100 characters. The body is optional.

## List Notes

**Request**

`GET /api/v1/notes?limit=10&offset=0`

**Response — 200 OK**

```json
{
  "items": [
    {
      "id": 101,
      "title": "Study JavaScript",
      "body": "Practise asynchronous requests",
      "createdAt": "2026-10-15T10:00:00Z",
      "updatedAt": "2026-10-15T10:00:00Z"
    }
  ],
  "limit": 10,
  "offset": 0,
  "total": 1
}
```

The API returns only notes belonging to the authenticated user. Pagination prevents a large collection from being returned in one response.

## Error Status Codes

### 400 Bad Request

The request is malformed or fails validation, such as a missing title or a title longer than 100 characters.

### 401 Unauthorized

The request has no valid authentication credentials, such as a missing or expired access token.

### 403 Forbidden

The user is authenticated but is not permitted to perform the requested operation.

### 404 Not Found

The requested note or tag does not exist or is not accessible to the authenticated user.

### 500 Internal Server Error

An unexpected server-side failure occurred.

**Example error response**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The title is required and must be at most 100 characters."
  }
}
```

## Security and Validation

- Use HTTPS for requests in production.
- Validate all input on the server, even if the client also validates it.
- Use parameterised SQL queries to prevent SQL injection.
- Verify ownership before returning, updating, or deleting a note.
- Apply rate limits and reasonable pagination limits.
