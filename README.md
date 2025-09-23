# File Clerk

A tiny, browser-only set of Custom Elements for uploading, storing, listing, viewing, splitting, and archiving files — all client-side with IndexedDB (via localforage). No build step required.

This repo includes the following web components:
- `<file-uploader>` — file picker UI that emits a fileuploaded event with a Data URL
- `<file-clerk>` — persistence and simple UI (optional) backed by localforage
- `<file-viewer>` — renders a Data URL by MIME type (images, video, audio, PDF, text)
- `<file-splitter>` — splits and rejoins Data URL strings (14 KB chunks)
- `<file-archive>` — export/import all saved files as a ZIP (client-only)

Quick links
- Hosted ESM bundle (recommended): https://lindseymysse.com/file-clerk/file-clerk.min.js
- Example page in this repo: index.html


## Quick start (copy/paste)

Include the hosted ESM bundle and drop the elements into your page. This registers all custom elements globally.

```html path=null start=null
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>File Clerk — Quick Start</title>
    <!-- Registers: file-uploader, file-clerk, file-viewer, file-splitter, file-archive -->
    <script type="module" src="https://lindseymysse.com/file-clerk/file-clerk.min.js"></script>
  </head>
  <body>
    <file-uploader></file-uploader>
    <file-clerk id="file_clerk" verbose></file-clerk>
    <file-viewer id="file_viewer"></file-viewer>
    <file-splitter id="file_splitter"></file-splitter>
    <file-archive id="file_archive" target="#file_clerk" verbose></file-archive>

    <script type="module">
      // Wait until file-clerk is defined before calling methods early on
      const fileClerk = document.getElementById('file_clerk');
      const fileViewer = document.getElementById('file_viewer');
      const fileSplitter = document.getElementById('file_splitter');
      const fileUploader = document.querySelector('file-uploader');

      const ready = customElements.whenDefined('file-clerk').then(() => {
        if (customElements.upgrade) customElements.upgrade(fileClerk);
      });

      // Uploader -> Clerk (save)
      fileUploader.addEventListener('fileuploaded', async (e) => {
        await ready;
        const { fileData, name, notes } = e.detail;
        fileClerk.saveFile(name, fileData, notes);
      });

      // Clerk (open) -> Splitter -> Viewer
      fileClerk.addEventListener('file-opened', (e) => {
        const chunks = fileSplitter.splitFiles(e.detail.contents);
        const rejoined = fileSplitter.joinFiles(chunks);
        fileViewer.openFile(rejoined);
      });
    </script>
  </body>
</html>
```

Run it locally with any static server:
- macOS/Linux: python3 -m http.server 8000
- Then open http://localhost:8000/index.html


## Components, APIs, and events

Below are the public surfaces you’ll typically use. All persistence happens client-side with IndexedDB via localforage.

### `<file-uploader>`
- Purpose: lets the user pick a file; previews name/size; emits fileuploaded.
- Event: fileuploaded with detail: { fileData, name, notes }
  - fileData is a Data URL (data:<mime>;base64,...)

Example: listen for fileuploaded
```js path=null start=null
const uploader = document.querySelector('file-uploader');
uploader.addEventListener('fileuploaded', (e) => {
  const { fileData, name, notes } = e.detail;
  console.log('Got file:', { name, notes, bytes: fileData.length });
});
```


### `<file-clerk>`
- Purpose: persistence and simple UI when verbose is set.
- Backing store: localforage (IndexedDB with localStorage fallback)
- Methods:
  - await saveFile(filename, contents, metadata)
  - await deleteFile(id)
  - await listFiles() => [{ id, filename, contents, metadata }]
  - await openFile(id) => dispatches file-opened with the file data
- Events:
  - file-opened with detail: { filename, contents, metadata }

Example: programmatic save/list/open
```js path=null start=null
const clerk = document.querySelector('file-clerk');
await customElements.whenDefined('file-clerk');

// Save a text file programmatically
const contents = 'data:text/plain;base64,' + btoa('Hello, File Clerk!');
await clerk.saveFile('hello.txt', contents, { author: 'you' });

// List all files
const files = await clerk.listFiles();
console.table(files.map(f => ({ id: f.id, name: f.filename })));

// Open the first file (fires `file-opened`)
if (files[0]) await clerk.openFile(files[0].id);
```

Example: build your own file list UI (no verbose)
```html path=null start=null
<file-clerk id="clerk"></file-clerk>
<ul id="list"></ul>
<script type="module">
  const clerk = document.getElementById('clerk');
  const list = document.getElementById('list');
  await customElements.whenDefined('file-clerk');

  async function refresh() {
    list.innerHTML = '';
    for (const f of await clerk.listFiles()) {
      const li = document.createElement('li');
      li.textContent = f.filename;
      const open = document.createElement('button');
      open.textContent = 'Open';
      open.onclick = () => clerk.openFile(f.id);
      const del = document.createElement('button');
      del.textContent = 'Delete';
      del.onclick = async () => { await clerk.deleteFile(f.id); refresh(); };
      li.append(open, del);
      list.append(li);
    }
  }
  refresh();
</script>
```


### <file-viewer>
- Purpose: render a file Data URL by MIME type
- Supports: image/jpeg, image/png, video/mp4, audio/mpeg, application/pdf, text/plain
- Method: openFile(dataUrl)

Example: open a text file
```js path=null start=null
const viewer = document.querySelector('file-viewer');
const dataUrl = 'data:text/plain;base64,' + btoa('README example');
viewer.openFile(dataUrl);
```


### <file-splitter>
- Purpose: split/join long Data URL strings (14 KB chunks)
- Methods:
  - splitFiles(dataUrl) => [{ index, data }] chunks
  - joinFiles(chunks) => dataUrl

Example: round-trip
```js path=null start=null
const splitter = document.querySelector('file-splitter');
const chunks = splitter.splitFiles(myDataUrl);
const rejoined = splitter.joinFiles(chunks);
console.log(rejoined === myDataUrl); // true
```


### <file-archive>
- Purpose: export/import your File Clerk storage as a single ZIP (client-only)
- Attributes:
  - target: CSS selector to locate the <file-clerk> instance (default: #file_clerk)
  - verbose: render buttons for Export ZIP / Import ZIP
- Methods (programmatic):
  - await exportArchive() — triggers download of a ZIP containing files/ and manifest.json
  - await importArchive(fileOrBlob) — imports from a ZIP generated by exportArchive()

Example: programmatic export/import
```js path=null start=null
const archive = document.querySelector('file-archive');

// Export all entries to a ZIP
await archive.exportArchive();

// Import from a chosen .zip file (via <input type="file" />)
const input = document.createElement('input');
input.type = 'file';
input.accept = '.zip';
input.onchange = async () => {
  const file = input.files && input.files[0];
  if (file) await archive.importArchive(file);
};
input.click();
```


## End-to-end wiring (from this repo’s index.html)

Below is the exact wiring used in index.html — uploader -> clerk.saveFile, and on open: split -> view.

```html path=/Users/lindseymysse/Code/file-clerk/index.html start=24
    // Ensure custom element is defined/upgraded before calling its methods
    const onClerkReady = customElements.whenDefined('file-clerk').then(() => {
      if (customElements.upgrade) {
        customElements.upgrade(fileClerkEl);
      }
    });

    // Wire uploader -> clerk save
    fileUploader.addEventListener('fileuploaded', async (event) => {
      await onClerkReady;
      const { fileData, name, notes } = event.detail;
      fileClerkEl.saveFile(name, fileData, notes);
    });

    // Initial list
    onClerkReady.then(() => {
      if (typeof fileClerkEl.listFiles === 'function') {
        fileClerkEl.listFiles().then((res) => console.log(res));
      }
    });

    // Open -> split -> view
    fileClerkEl.addEventListener('file-opened', async (e) => {
      const rejoined_file = fileSplitterEl.joinFiles(
        fileSplitterEl.splitFiles(e.detail.contents)
      );
      fileViewerEl.openFile(rejoined_file);
    });
```


## Local development

There is no build step. Serve the directory with a static server to avoid browser restrictions when fetching Data URLs for text rendering.

- Start a server in this directory:
  - python3 -m http.server 8000
- Open the app:
  - open http://localhost:8000/index.html

Notes
- The minified bundle registers all elements. If you want to use the source modules directly, you’ll need a bundler or import maps for external deps (client-zip, unzipit). The hosted bundle is the simplest path.


## Data model and storage

file-clerk stores entries as:
```json path=null start=null
{
  "id": "<uuid>",
  "filename": "<string>",
  "contents": "data:<mime>;base64,<...>",
  "metadata": { "notes": "<string>", "...": "any" }
}
```
- Storage is powered by localforage, using IndexedDB when available.
- Clearing storage during development: either
  - use <file-clerk> methods to list and delete each entry, or
  - clear site data for http://localhost:8000 in your browser’s devtools.

Example: clear via API
```js path=null start=null
const clerk = document.querySelector('file-clerk');
await customElements.whenDefined('file-clerk');
for (const f of await clerk.listFiles()) {
  await clerk.deleteFile(f.id);
}
```


## Tips, limits, and troubleshooting

- Use a local HTTP server. Opening index.html with file:// can sometimes work, but http://localhost ensures consistent behavior.
- File sizes: Data URLs are base64-encoded and can get large quickly. Browsers impose IndexedDB quotas; keep files reasonably small (a few MB) for best results.
- Wait for custom elements to be defined before calling methods: await customElements.whenDefined('file-clerk').
- Text rendering uses fetch(dataUrl). Serving over http:// avoids some browser edge cases.
- MIME types: If a Data URL has an unknown or octet-stream MIME, <file-archive> tries to correct it during import using the manifest or filename extension.


## Extending

Because these are standard Custom Elements, you can:
- Compose them with your own UI — hide verbose UIs and build your own list/details views.
- Listen to their events (fileuploaded, file-opened) and add your own application logic.
- Store extra metadata alongside files; it’s just an object argument to saveFile().


## License

MIT (or the license of this repository, if specified elsewhere).
