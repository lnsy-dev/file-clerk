import DataroomElement from "dataroom-js";

/**
 * File Splitter Component
 *
 * A utility component that can split large Data URL strings into smaller chunks
 * and rejoin them back into the original Data URL. Useful for handling large files
 * that may exceed storage or transmission limits.
 *
 * @class FileSplitter
 * @extends DataroomElement
 * 
 * @example
 * // HTML usage:
 * <file-splitter></file-splitter>
 * 
 * // JavaScript usage:
 * const splitter = document.querySelector('file-splitter');
 * const chunks = splitter.splitFiles(dataURL);
 * const rejoined = splitter.joinFiles(chunks);
 */
class FileSplitter extends DataroomElement {
  /**
   * Chunk size constant for splitting files (14KB)
   * @type {number}
   * @constant
   */
  static CHUNK_SIZE = 14000;

  /**
   * Initializes the file splitter component
   * Currently a no-op initializer as this component is primarily used for utility functions
   * @returns {Promise<void>}
   */
  async initialize() {
    // No-op initializer for now
  }

  /**
   * Splits a Data URL string into chunks no bigger than 14KB
   * Each chunk contains an index and the data portion for that chunk
   * @param {string} dataURL - The Data URL string to split into chunks
   * @returns {Array<Object>} Array of chunk objects with index and data properties
   * 
   * @example
   * const chunks = splitter.splitFiles('data:image/jpeg;base64,/9j/4AAQ...');
   * // Returns: [{ index: 0, data: 'data:image...' }, { index: 1, data: '...' }]
   */
  splitFiles(dataURL) {
    const CHUNK_SIZE = FileSplitter.CHUNK_SIZE;
    const totalChunks = Math.ceil(dataURL.length / CHUNK_SIZE);
    const chunks = [];

    for (let i = 0; i < totalChunks; i++) {
      const startIndex = i * CHUNK_SIZE;
      const endIndex = (i + 1) * CHUNK_SIZE;
      const chunk = {
        index: i,
        data: dataURL.slice(startIndex, endIndex),
      };
      chunks.push(chunk);
    }

    return chunks;
  }

  /**
   * Joins an array of file chunks back into the original Data URL string
   * Sorts chunks by index before concatenating to ensure proper order
   * @param {Array<Object>} chunks - Array of chunk objects with index and data properties
   * @returns {string} The reconstructed Data URL string
   * 
   * @example
   * const originalDataURL = splitter.joinFiles(chunks);
   * // Returns: 'data:image/jpeg;base64,/9j/4AAQ...'
   */
  joinFiles(chunks) {
    // Sort the chunks by index to ensure proper order
    chunks.sort((a, b) => a.index - b.index);

    // Concatenate the data from each chunk
    let data = "";
    for (let i = 0; i < chunks.length; i++) {
      data += chunks[i].data;
    }

    return data;
  }
}

// Define the custom element
customElements.define("file-splitter", FileSplitter);
