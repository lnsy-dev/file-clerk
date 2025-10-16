import DataroomElement from 'dataroom-js';

/**
 * File System Component
 *
 * A headless Custom Element that implements the Web File System API for reading, writing,
 * and managing files on the user's local file system. Provides only core functionality
 * without any UI elements - acts as a pure function container.
 *
 * @class FileSystemComponent
 * @extends DataroomElement
 * 
 * @example
 * // HTML usage:
 * <file-system id="fs"></file-system>
 * 
 * // JavaScript usage:
 * const fileSystem = document.getElementById('fs');
 * await fileSystem.pickDirectory();
 * const files = await fileSystem.listFiles();
 * 
 * @fires file-opened - When a file is opened from the file system
 * @fires file-saved - When a file is saved to the file system  
 * @fires file-deleted - When a file is deleted from the file system
 * @fires directory-selected - When a directory is selected
 * @fires files-listed - When files are listed from a directory
 * @fires file-auto-saved - When a file is auto-saved
 * @fires autosave-toggled - When auto-save is enabled/disabled
 * @fires file-system-error - When an error occurs with file system operations
 */
export default class FileSystemComponent extends DataroomElement {
  
  /**
   * Initializes the file system component
   * Sets up initial state and checks API support - no UI rendering
   * @returns {Promise<void>}
   */
  async initialize() {
    this.log('Initializing file system component');
    
    // Initialize component state
    this.directoryHandle = null;
    this.fileHandles = new Map(); // Cache file handles by path
    this.autoSaveEnabled = false;
    this.autoSaveDelay = 2000; // 2 seconds default
    this.autoSaveTimeouts = new Map();
    
    // Check API support and emit errors if needed
    this.checkApiSupport();
  }


  /**
   * Checks if the Web File System API is supported in the current browser
   * Emits detailed error events if API is not supported or context is insecure
   * @returns {boolean} True if API is supported, false otherwise
   */
  checkApiSupport() {
    const isSupported = 'showOpenFilePicker' in window && 
                       'showSaveFilePicker' in window && 
                       'showDirectoryPicker' in window;
    
    if (!isSupported) {
      this.dispatchError('FILE_SYSTEM_API_NOT_SUPPORTED', 
        'File System API is not supported in this browser. ' +
        'Please use Chrome/Edge 86+, Firefox requires enabling dom.fs.enabled in about:config. ' +
        'Safari does not currently support this API. ' +
        'The File System API also requires HTTPS or localhost.');
    }
    
    // Check for secure context
    if (!window.isSecureContext) {
      this.dispatchError('INSECURE_CONTEXT', 
        'File System API requires a secure context (HTTPS or localhost).');
    }
    
    return isSupported;
  }

  /**
   * Opens a directory picker dialog for the user to select a directory
   * Stores the directory handle for subsequent file operations
   * @returns {Promise<FileSystemDirectoryHandle|void>} The selected directory handle
   * @fires directory-selected - When a directory is successfully selected
   */
  async pickDirectory() {
    try {
      if (!this.checkApiSupport()) return;
      
      this.directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });
      
      this.log(`Directory selected: ${this.directoryHandle.name}`);
      
      this.event('directory-selected', { handle: this.directoryHandle });
      
      return this.directoryHandle;
      
    } catch (error) {
      this.handleError('DIRECTORY_PICKER_ERROR', error);
    }
  }

  /**
   * Opens a file picker dialog for the user to select and read a file
   * @returns {Promise<Object|void>} Object containing file handle, file, and content
   * @fires file-opened - When a file is successfully opened
   */
  async pickFile() {
    try {
      if (!this.checkApiSupport()) return;
      
      const [fileHandle] = await window.showOpenFilePicker({
        multiple: false
      });
      
      const file = await fileHandle.getFile();
      const content = await file.text();
      
      const result = {
        handle: fileHandle, 
        file: file,
        content: content,
        name: file.name,
        path: fileHandle.name
      };
      
      this.event('file-opened', result);
      this.log(`File opened: ${file.name}`);
      
      return result;
      
    } catch (error) {
      this.handleError('FILE_PICKER_ERROR', error);
    }
  }

  /**
   * Opens a save file picker and saves content to the selected file
   * @param {string} content - The content to save to the file
   * @param {string} [filename] - Suggested filename for the save dialog
   * @returns {Promise<FileSystemFileHandle|void>} The saved file handle
   * @fires file-saved - When a file is successfully saved
   */
  async saveFile(content, filename = null) {
    try {
      if (!this.checkApiSupport()) return;
      
      const options = {};
      if (filename) {
        options.suggestedName = filename;
      }
      
      const fileHandle = await window.showSaveFilePicker(options);
      await this.writeToFile(fileHandle, content);
      
      this.log(`File saved: ${fileHandle.name}`);
      
      this.event('file-saved', { handle: fileHandle, content: content });
      
      return fileHandle;
      
    } catch (error) {
      this.handleError('FILE_SAVE_ERROR', error);
    }
  }

  /**
   * Writes content to a file using the FileSystemWritableFileStream interface
   * @param {FileSystemFileHandle} fileHandle - The file handle to write to
   * @param {string} content - The content to write to the file
   * @returns {Promise<void>}
   */
  async writeToFile(fileHandle, content) {
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  /**
   * Triggers auto-save functionality with debouncing
   * @param {FileSystemFileHandle} fileHandle - The file handle to auto-save to
   * @param {string} content - The content to auto-save
   * @returns {Promise<void>}
   * @fires file-auto-saved - When auto-save completes successfully
   */
  async autoSave(fileHandle, content) {
    if (!this.autoSaveEnabled || !fileHandle) return;
    
    const path = fileHandle.name;
    
    // Clear existing timeout for debouncing
    if (this.autoSaveTimeouts.has(path)) {
      clearTimeout(this.autoSaveTimeouts.get(path));
    }
    
    // Set new timeout
    const timeoutId = setTimeout(async () => {
      try {
        await this.writeToFile(fileHandle, content);
        this.log(`Auto-saved: ${fileHandle.name}`);
        
        this.event('file-auto-saved', { handle: fileHandle, content: content });
        
        this.autoSaveTimeouts.delete(path);
      } catch (error) {
        this.handleError('AUTO_SAVE_ERROR', error);
      }
    }, this.autoSaveDelay);
    
    this.autoSaveTimeouts.set(path, timeoutId);
  }

  /**
   * Lists all files in the currently selected directory
   * @returns {Promise<Array|void>} Array of file objects with metadata
   * @fires files-listed - When files are successfully listed
   */
  /**
   * Lists all files in the currently selected directory
   * @returns {Promise<Array|void>} Array of file objects with metadata
   * @fires files-listed - When files are successfully listed
   */
  async listFiles() {
    if (!this.directoryHandle) {
      this.log('No directory selected');
      return [];
    }
    
    try {
      const files = [];
      
      for await (const [name, handle] of this.directoryHandle.entries()) {
        if (handle.kind === 'file') {
          const file = await handle.getFile();
          files.push({
            name: name,
            handle: handle,
            size: file.size,
            lastModified: new Date(file.lastModified),
            type: file.type
          });
        }
      }
      
      this.event('files-listed', { files: files });
      
      return files;
      
    } catch (error) {
      this.handleError('LIST_FILES_ERROR', error);
      return [];
    }
  }

  /**
   * Reads a file's content using its file handle
   * @param {FileSystemFileHandle} fileHandle - The file handle to read from
   * @returns {Promise<Object|void>} Object containing file and content data
   * @fires file-read - When file is successfully read
   */
  async readFile(fileHandle) {
    try {
      const file = await fileHandle.getFile();
      const content = await file.text();
      
      const result = {
        handle: fileHandle, 
        file: file,
        content: content,
        name: file.name
      };
      
      this.event('file-read', result);
      
      return result;
      
    } catch (error) {
      this.handleError('FILE_READ_ERROR', error);
    }
  }

  /**
   * Deletes a file from the currently selected directory
   * @param {FileSystemFileHandle} fileHandle - The file handle to delete
   * @returns {Promise<void>}
   * @fires file-deleted - When file is successfully deleted
   */
  async deleteFile(fileHandle) {
    try {
      if (!this.directoryHandle) {
        throw new Error('No directory selected');
      }
      
      await this.directoryHandle.removeEntry(fileHandle.name);
      
      this.log(`File deleted: ${fileHandle.name}`);
      
      this.event('file-deleted', { handle: fileHandle });
      
      
    } catch (error) {
      this.handleError('FILE_DELETE_ERROR', error);
    }
  }


  /**
   * Handles and formats different types of file system errors
   * @param {string} type - The type of error that occurred
   * @param {Error} error - The original error object
   * @returns {void}
   */
  handleError(type, error) {
    let message = '';
    
    switch (type) {
      case 'FILE_SYSTEM_API_NOT_SUPPORTED':
      case 'INSECURE_CONTEXT':
        message = error;
        break;
      case 'DIRECTORY_PICKER_ERROR':
        message = error.name === 'AbortError' ? 
          'Directory selection cancelled' : 
          `Failed to select directory: ${error.message}`;
        break;
      case 'FILE_PICKER_ERROR':
        message = error.name === 'AbortError' ? 
          'File selection cancelled' : 
          `Failed to open file: ${error.message}`;
        break;
      case 'FILE_SAVE_ERROR':
        message = error.name === 'AbortError' ? 
          'File save cancelled' : 
          `Failed to save file: ${error.message}`;
        break;
      case 'AUTO_SAVE_ERROR':
        message = `Auto-save failed: ${error.message}`;
        break;
      case 'LIST_FILES_ERROR':
        message = `Failed to list files: ${error.message}`;
        break;
      case 'FILE_READ_ERROR':
        message = `Failed to read file: ${error.message}`;
        break;
      case 'FILE_DELETE_ERROR':
        message = `Failed to delete file: ${error.message}`;
        break;
      default:
        message = `Unknown error: ${error.message}`;
    }
    
    this.log(`Error: ${message}`);
    this.dispatchError(type, message, error);
  }

  /**
   * Dispatches a custom error event with detailed error information
   * @param {string} type - The type of error
   * @param {string} message - The formatted error message
   * @param {Error} [originalError=null] - The original error object
   * @returns {void}
   * @fires file-system-error - Custom error event with error details
   */
  dispatchError(type, message, originalError = null) {
    this.event('file-system-error', {
      type: type, 
      message: message, 
      originalError: originalError 
    });
  }

  /**
   * Sets the auto-save delay in milliseconds
   * @param {number} ms - Delay in milliseconds
   * @returns {void}
   */
  setAutoSaveDelay(ms) {
    this.autoSaveDelay = ms;
  }

  /**
   * Gets the current directory handle
   * @returns {FileSystemDirectoryHandle|null} The current directory handle
   */
  getDirectoryHandle() {
    return this.directoryHandle;
  }

  /**
   * Checks if the File System API is supported
   * @returns {boolean} True if supported, false otherwise
   */
  isApiSupported() {
    return this.checkApiSupport();
  }
}

// Register the custom element
customElements.define('file-system', FileSystemComponent);