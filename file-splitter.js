class FileSplitter extends HTMLElement {
  constructor() {
    super();
  }

  // function to split a dataURL into chunks no bigger than 14kb
  splitFiles(dataURL) {
    const CHUNK_SIZE = 14000;
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

  joinFiles(chunks) {
    // Sort the chunks by index
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
