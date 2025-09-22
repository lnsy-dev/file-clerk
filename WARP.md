# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- This is a small, browser-only web app built with vanilla JavaScript and Custom Elements (Web Components). There is no bundler, package.json, or test/lint setup. All functionality is wired together in index.html and runs entirely client-side.

Common commands
- Serve locally (recommended to avoid browser restrictions when loading resources):
  - Start a static server in this directory:
    - macOS/Linux (built-in Python):
      - python3 -m http.server 8000
  - Open the app:
    - open http://localhost:8000/index.html

- Build
  - Not applicable. There is no build step; the app runs directly in the browser.

- Lint
  - Not configured in this repository.

- Tests
  - No tests are present or configured.

High-level architecture
- Components (Custom Elements)
  - <file-uploader> (file-uploader.js)
    - Shadow DOM-based UI with a file input, name field, notes field, and an Upload button.
    - On click, reads the selected file as a Data URL via FileReader and dispatches a CustomEvent 'fileuploaded' with detail: { fileData, name, notes }.
  - <file-clerk> (file-clerk.js)
    - Acts as persistence and simple UI (when verbose attribute is present).
    - Uses window.crypto.randomUUID() to generate IDs and localforage (CDN via index.html) for storage in the browser (IndexedDB/localStorage fallback).
    - Methods:
      - saveFile(filename, contents, metadata) -> persists to localforage
      - listFiles() -> returns [{ id, filename, contents, metadata }]
      - openFile(id) -> dispatches 'file-opened' with the stored file data
      - deleteFile(id)
    - In verbose mode, renders an internal file list UI with Open/Delete actions and re-renders after mutations.
  - <file-viewer> (file-viewer.js)
    - Renders files by MIME type parsed from the Data URL (image/jpeg|png, video/mp4, audio/mpeg, application/pdf, text/plain). Text is fetched from the Data URL and displayed in a <pre>.
  - <file-splitter> (file-splitter.js)
    - Utility component to split a Data URL string into 14KB chunks and rejoin them. Currently used in the open flow as a demonstration (split, then join, then view). Storage is not chunked; chunking is transient.

- Orchestration (index.html)
  - Script order loads the components and wires them together in a simple controller script:
    - When <file-uploader> dispatches 'fileuploaded', the page calls file_clerk.saveFile(name, fileData, notes).
    - <file-clerk> in verbose mode renders a list with Open/Delete. On Open, it dispatches 'file-opened'.
    - The page listens for 'file-opened', uses <file-splitter> to split and then immediately rejoin the Data URL, and finally calls file_viewer.openFile(rejoinedData).
  - Dependency: localforage is loaded via a CDN <script> tag in index.html before <file-clerk> is used.

Development notes specific to this repo
- Because there is no bundler, any new functionality should be added via additional <script> tags in index.html, taking care with load order if symbols are referenced across files.
- Running under a local HTTP server is recommended. Opening index.html via file:// may work in some cases but can run into browser security policies (e.g., fetch of Data URLs for text rendering works, but serving over http://localhost ensures consistent behavior).
- Storage is entirely browser-side via localforage. To reset state during development, clear the site storage (IndexedDB/localStorage) from your browser's devtools for http://localhost:8000.
