# Music Playlist API

![Technologies Used](https://skills.syvixor.com/api/icons?perline=15&i=nodejs,expressjs,mongodb,vercel)

> This is a University Project for our IT Elective Course.

Built with **Node.js** and **Express.js**,
utilizing **MongoDB** and **Vercel** for database and deployment.

This API allows CRUD Operations for listing
**Playlists** and their **Songs**
which is represented in **JSON**.

###### Sorry, no actual music.

## Contents

- [Usage](#usage)
  - [Base Route](#base-route)
  - [GET Routes](#get-routes)
  - [POST Routes](#post-routes)
  - [PUT Routes](#put-routes)
  - [DELETE Routes](#delete-routes)
- [Request Examples](#request-examples)
- [What Data do they return?](#what-data-do-they-return)

## Usage

### Base Route:

    https://domain.vercel.app/api/v1/

### GET Routes

Get All Playlists:

    /playlists

Get a Playlist by ID:

    /playlists/:playlistId

Get Playlists by Name:

    /playlists/name/:playlistName

Get All Songs from a Playlist by PlaylistID:

    /playlists/:playlistId/songs

Get All Songs from a Playlist by SongID:

    /playlists/:playlistId/songs/:songId

### POST Routes

Create a new Playlist:

    /playlists

Create a new Song:

    /playlists/:playlistId/songs

### PUT Routes

Update a Playlist:

    /playlists/:playlistId

Update a Song:

    /playlists

### DELETE Routes

Delete a Playlist by ID:

    /playlists/:playlistId

Delete a Song by ID:

    /playlists/:playlistId/songs/:songId

## Request Examples

**GET** Request:

```bash
curl https://domain.vercel.app/api/v1/playlists
```

**POST** Request:

```bash
curl -X POST https://domain.vercel.app/api/v1/playlists -H "Content-Type: application/json" -d '{"title": "Japanese Playlist", "author": "Z"}'
```

**PUT** Request:

```bash
curl -X PUT https://domain.vercel.app/api/v1/playlists/pl4yl1s71D -H "Content-Type: application/json" -d '{"title": "Ballad Playlist"}'
```

**DELETE** Request:

```bash
curl -X DELETE https://domain.vercel.app/api/v1/playlists/pl4yl1s71D
```

## What Data do they return?

All data is represented in JSON

Playlist:

```json
{
  "name": "Playlist Name",
  "author": "Playlist Author"
}
```

Song:

```json
{
  "title": "Song Title",
  "artist": "Song Artists"
}
```
