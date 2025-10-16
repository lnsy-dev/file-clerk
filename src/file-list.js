import DataroomElement from "dataroom-js";

/**
 * File List Component
 *
 * A component that displays a list of files from a FileSystem directory handle.
 * Renders files as an unordered list with file information and action buttons.
 * Gets the directory to list from a target FileSystem component specified by attribute.
 *
 * @class FileList
 * @extends DataroomElement
 * 
 * @example
 * // HTML usage:
 * <file-list target="#file-system"></file-list>
 * 
 * // JavaScript usage:
 * const fileList = document.querySelector('file-list');
 * await fileList.refresh(); // Refresh the file list
 * 
 * @fires file-selected - When a file is selected from the list
 * @fires file-action - When an action button is clicked
 */
class FileList extends DataroomElement {
  /**
   * Initializes the file list component
   * Sets up the target FileSystem selector and renders empty list
   * @returns {Promise<void>}
   */
  async initialize() {
    this.log('Initializing file list component');
    
    // Get target FileSystem component selector
    this.targetSelector = this.getAttribute('target') || '#file-system';
    
    // Initialize empty list
    this.render();
    
    // Listen for file system events to auto-refresh
    this.setupFileSystemListeners();
  }

  /**
   * Gets the target FileSystem component
   * @returns {HTMLElement|null} The FileSystem element or null if not found
   */
  get fileSystem() {
    return document.querySelector(this.targetSelector);
  }

  /**
   * Renders the file list container as an unordered list
   * @returns {void}
   */
  render() {
    // Clear existing content
    this.innerHTML = '';
    
    // Create the main file list container
    this.fileListUL = this.create('ul', {
      class: 'file-list',
      style: 'list-style: none; padding: 0; margin: 0; border: 1px solid #ddd; border-radius: 4px; max-height: 300px; overflow-y: auto;'
    });
  }

  /**
   * Sets up listeners for FileSystem component events
   * Auto-refreshes the list when directory changes or files are modified
   * @returns {void}
   */
  setupFileSystemListeners() {
    const fileSystem = this.fileSystem;
    if (!fileSystem) return;
    
    // Listen for directory selection and file changes
    fileSystem.addEventListener('directory-selected', () => this.refresh());
    fileSystem.addEventListener('file-saved', () => this.refresh());
    fileSystem.addEventListener('file-deleted', () => this.refresh());
  }

  /**
   * Refreshes the file list by fetching files from the FileSystem component
   * @returns {Promise<void>}
   */
  async refresh() {
    const fileSystem = this.fileSystem;
    if (!fileSystem || typeof fileSystem.listFiles !== 'function') {
      this.displayMessage('File system not available');
      return;
    }

    try {
      const files = await fileSystem.listFiles();
      this.displayFiles(files || []);
    } catch (error) {
      console.error('Error refreshing file list:', error);
      this.displayMessage('Error loading files');
    }
  }

  /**
   * Displays a list of files in the unordered list
   * @param {Array<Object>} files - Array of file objects with name, size, etc.
   * @returns {void}
   */
  displayFiles(files) {
    // Clear existing list items
    this.fileListUL.innerHTML = '';

    if (files.length === 0) {
      this.displayMessage('No files found');
      return;
    }

    // Create list items for each file
    files.forEach((file) => {
      const listItem = this.create('li', {
        class: 'file-item',
        style: 'padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; cursor: pointer;'
      }, this.fileListUL);

      // Add hover effect
      listItem.addEventListener('mouseenter', () => {
        listItem.style.backgroundColor = '#f5f5f5';
      });
      listItem.addEventListener('mouseleave', () => {
        listItem.style.backgroundColor = '';
      });

      // Create file info section
      const fileInfo = this.create('div', {
        class: 'file-info',
        style: 'flex-grow: 1;'
      }, listItem);

      this.create('div', {
        class: 'file-name',
        content: file.name,
        style: 'font-weight: bold; margin-bottom: 4px;'
      }, fileInfo);

      this.create('div', {
        class: 'file-details',
        content: `${this.formatFileSize(file.size)} • ${this.formatDate(file.lastModified)}`,
        style: 'font-size: 0.8em; color: #666;'
      }, fileInfo);

      // Create action buttons section
      const actions = this.create('div', {
        class: 'file-actions',
        style: 'display: flex; gap: 8px;'
      }, listItem);

      const readBtn = this.create('button', {
        class: 'read-btn',
        content: '📂',
        title: 'Open file',
        style: 'padding: 8px; font-size: 1.2em; border: 1px solid #007bff; border-radius: 4px; background: #007bff; color: white; cursor: pointer;'
      }, actions);

      const deleteBtn = this.create('button', {
        class: 'delete-btn',
        content: '🗑️',
        title: 'Delete file',
        style: 'padding: 8px; font-size: 1.2em; border: 1px solid #dc3545; border-radius: 4px; background: #dc3545; color: white; cursor: pointer;'
      }, actions);

      // Add event listeners for actions
      readBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleFileAction('read', file);
      });

      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleFileAction('delete', file);
      });

      // Add click handler for file selection
      listItem.addEventListener('click', () => {
        this.handleFileSelection(file);
      });
    });
  }

  /**
   * Displays a message in the file list when there are no files or an error
   * @param {string} message - The message to display
   * @returns {void}
   */
  displayMessage(message) {
    this.fileListUL.innerHTML = '';
    
    const messageItem = this.create('li', {
      class: 'message-item',
      content: message,
      style: 'padding: 20px; text-align: center; color: #666; font-style: italic;'
    }, this.fileListUL);
  }

  /**
   * Handles file action button clicks
   * @param {string} action - The action type ('read' or 'delete')
   * @param {Object} file - The file object
   * @returns {void}
   */
  async handleFileAction(action, file) {
    const fileSystem = this.fileSystem;
    if (!fileSystem) return;

    try {
      switch (action) {
        case 'read':
          if (typeof fileSystem.readFile === 'function') {
            await fileSystem.readFile(file.handle);
          }
          break;
        case 'delete':
          if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
            if (typeof fileSystem.deleteFile === 'function') {
              await fileSystem.deleteFile(file.handle);
            }
          }
          break;
      }
      
      // Emit custom event for external listeners
      this.event('file-action', { action, file });
      
    } catch (error) {
      console.error(`Error performing ${action} on file:`, error);
    }
  }

  /**
   * Handles file selection (clicking on the file item)
   * @param {Object} file - The selected file object
   * @returns {void}
   */
  handleFileSelection(file) {
    // Emit file selection event
    this.event('file-selected', { file });
  }

  /**
   * Formats file size in human-readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Formats date in localized string
   * @param {Date} date - The date to format
   * @returns {string} Formatted date string
   */
  formatDate(date) {
    return date ? date.toLocaleString() : 'Unknown';
  }
}

customElements.define('file-list', FileList);