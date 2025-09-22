import DataroomElement from "../dataroom.js";

class FileUploader extends DataroomElement {
  async initialize() {
    const template = document.createElement('template');
    template.innerHTML = `
      <label for="file-input">Select a file:</label>
      <input type="file" id="file-input" />
      <label for="file-name">Name:</label>
      <input type="text" id="file-name" />
      <label for="file-notes">Notes:</label>
      <textarea id="file-notes"></textarea>
      <button id="upload-button">Upload</button>
    `;
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    const fileInput = this.shadowRoot.querySelector('#file-input');
    const fileName = this.shadowRoot.querySelector('#file-name');
    const fileNotes = this.shadowRoot.querySelector('#file-notes');
    const uploadButton = this.shadowRoot.querySelector('#upload-button');

    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      fileName.value = file.name || '';
      fileNotes.value = `${(file.size / 1024).toFixed(2)} KB`;
    });

    uploadButton.addEventListener('click', () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const name = fileName.value;
      const notes = fileNotes.value;
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const fileData = reader.result;
        const eventData = { fileData, name, notes };
        const event = new CustomEvent('fileuploaded', { detail: eventData });
        this.dispatchEvent(event);
      };
    });
  }
}

customElements.define('file-uploader', FileUploader);
