import DataroomElement from "dataroom-js";

/**
 * File Uploader Component
 *
 * A custom element that provides a user interface for selecting, naming, and uploading files.
 * The component reads selected files as Data URLs and dispatches events when files are uploaded.
 *
 * @class FileUploader
 * @extends DataroomElement
 * 
 * @example
 * // HTML usage:
 * <file-uploader></file-uploader>
 * 
 * // JavaScript usage:
 * const uploader = document.querySelector('file-uploader');
 * uploader.addEventListener('fileuploaded', (event) => {
 *   const { fileData, name, notes } = event.detail;
 *   console.log('File uploaded:', name);
 * });
 * 
 * @fires fileuploaded - When a file is successfully uploaded with file data, name, and notes
 */
class FileUploader extends DataroomElement {
  /**
   * Initializes the file uploader component
   * Creates the file upload form with input fields and sets up event handlers
   * @returns {Promise<void>}
   */
  async initialize() {
    // Create the file upload form using dataroom-js create method
    this.create('label', { 
      for: 'file-input',
      content: 'Select a file:'
    });
    
    const fileInput = this.create('input', {
      type: 'file',
      id: 'file-input'
    });
    
    this.create('label', {
      for: 'file-name', 
      content: 'Name:'
    });
    
    const fileName = this.create('input', {
      type: 'text',
      id: 'file-name'
    });
    
    this.create('label', {
      for: 'file-notes',
      content: 'Notes:'
    });
    
    const fileNotes = this.create('textarea', {
      id: 'file-notes'
    });
    
    const uploadButton = this.create('button', {
      id: 'upload-button',
      content: 'Upload'
    });

    // Set up file input change handler
    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      fileName.value = file.name || '';
      fileNotes.value = `${(file.size / 1024).toFixed(2)} KB`;
    });

    // Set up upload button click handler
    uploadButton.addEventListener('click', () => {
      this.handleUpload(fileInput, fileName, fileNotes);
    });
  }
  
  /**
   * Handles the file upload process
   * Reads the selected file as a Data URL and dispatches the fileuploaded event
   * @param {HTMLInputElement} fileInput - The file input element
   * @param {HTMLInputElement} fileName - The file name input element  
   * @param {HTMLTextAreaElement} fileNotes - The file notes textarea element
   * @returns {void}
   */
  handleUpload(fileInput, fileName, fileNotes) {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    
    const name = fileName.value;
    const notes = fileNotes.value;
    const reader = new FileReader();
    
    reader.readAsDataURL(file);
    reader.onload = () => {
      const fileData = reader.result;
      const eventData = { fileData, name, notes };
      
      // Use dataroom-js event method to dispatch custom event
      this.event('fileuploaded', eventData);
    };
  }
}

customElements.define('file-uploader', FileUploader);
