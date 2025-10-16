import DataroomElement from "dataroom-js";
import localforage from './vendor/localforage-esm.js';

/**
 * File Clerk Component
 *
 * A file management component that provides browser-based storage and retrieval
 * of files using localforage (IndexedDB/localStorage). Handles file persistence,
 * listing, opening, and deletion with optional verbose UI.
 *
 * @class FileClerk
 * @extends DataroomElement
 * 
 * @example
 * // HTML usage:
 * <file-clerk verbose></file-clerk>
 * 
 * // JavaScript usage:
 * const clerk = document.querySelector('file-clerk');
 * await clerk.saveFile('document.txt', 'data:text/plain;base64,...', 'My notes');
 * const files = await clerk.listFiles();
 * 
 * @fires file-opened - When a file is opened from storage
 */
class FileClerk extends DataroomElement {
  /**
   * Initializes the file clerk component
   * Sets up crypto API reference and renders verbose UI if requested
   * @returns {Promise<void>}
   */
  async initialize() {
    this.crypto = window.crypto || window.msCrypto;
    
    if (this.hasAttribute("verbose")) {
      this.create('h1', {
        content: 'File Clerk'
      });
      
      this.create('div', {
        class: 'file-list'
      });
      
      await this.renderFileList();
    }
  }

  /**
   * Saves a file to browser storage with a generated unique ID
   * @param {string} filename - The name of the file
   * @param {string} contents - The file contents (typically a Data URL)
   * @param {string} metadata - Additional metadata about the file
   * @returns {Promise<void>}
   */
  async saveFile(filename, contents, metadata) {
    const id = this.crypto.randomUUID();
    const fileData = { filename, contents, metadata };
    await localforage.setItem(id, fileData);
    
    if (this.hasAttribute("verbose")) {
      this.renderFileList();
    }
  }

  /**
   * Deletes a file from browser storage by its ID
   * @param {string} id - The unique ID of the file to delete
   * @returns {Promise<void>}
   */
  async deleteFile(id) {
    await localforage.removeItem(id);
    
    if (this.hasAttribute("verbose")) {
      this.renderFileList();
    }
  }

  /**
   * Lists all files stored in browser storage
   * @returns {Promise<Array<Object>>} Array of file objects with id, filename, contents, and metadata
   */
  async listFiles() {
    const keys = await localforage.keys();
    const files = await Promise.all(
      keys.map(async (key) => {
        const fileData = await localforage.getItem(key);
        return {
          id: key,
          filename: fileData.filename,
          contents: fileData.contents,
          metadata: fileData.metadata,
        };
      })
    );
    return files;
  }

  /**
   * Opens a file from storage by its ID and dispatches a file-opened event
   * @param {string} id - The unique ID of the file to open
   * @returns {Promise<void>}
   * @fires file-opened - Custom event containing the file data
   */
  async openFile(id) {
    const fileData = await localforage.getItem(id);
    // Use dataroom-js event method instead of CustomEvent
    this.event("file-opened", fileData);
  }

  /**
   * Renders the file list UI in verbose mode
   * Creates interactive file list with open and delete buttons
   * @returns {Promise<void>}
   */
  async renderFileList() {
    if (!this.hasAttribute("verbose")) {
      return;
    }
    
    const files = await this.listFiles();
    const fileList = this.querySelector(".file-list");
    
    if (fileList) {
      fileList.innerHTML = "";
      
      files.forEach((file) => {
        // Create file container div using dataroom-js create method
        const fileElement = this.create("div", {}, fileList);
        
        // Create filename span
        this.create("span", {
          content: file.filename
        }, fileElement);
        
        // Create open button
        const openButton = this.create("button", {
          content: "Open"
        }, fileElement);
        
        openButton.addEventListener("click", async () => {
          await this.openFile(file.id);
        });
        
        // Create delete button
        const deleteButton = this.create("button", {
          content: "Delete"
        }, fileElement);
        
        deleteButton.addEventListener("click", async () => {
          await this.deleteFile(file.id);
        });
      });
    }
  }
}

customElements.define("file-clerk", FileClerk);
