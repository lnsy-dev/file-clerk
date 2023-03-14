

class FileClerk extends HTMLElement {
  constructor() {
    super();
    this.crypto = window.crypto || window.msCrypto;
  }

  async saveFile(filename, contents, metadata) {
    const id = this.crypto.randomUUID();
    const fileData = { filename, contents, metadata };
    await localforage.setItem(id, fileData);
    if (this.hasAttribute('verbose')) {
      this.renderFileList();
    }
  }

  async deleteFile(id) {
    await localforage.removeItem(id);
    if (this.hasAttribute('verbose')) {
      this.renderFileList();
    }
  }

  async listFiles() {
    const keys = await localforage.keys();
    const files = await Promise.all(
      keys.map(async (key) => {
        const fileData = await localforage.getItem(key);
        return { 
          id: key, 
          filename: fileData.filename, 
          contents: fileData.contents, 
          metadata: fileData.metadata 
        };
      })
    );
    return files;
  }

  async openFile(id) {
    const fileData = await localforage.getItem(id);
    const event = new CustomEvent('file-opened', { detail: fileData });
    this.dispatchEvent(event);
  }

  async renderFileList() {
    if (!this.hasAttribute('verbose')) {
      return;
    }
    const files = await this.listFiles();
    const fileList = this.querySelector('.file-list');
    if (fileList) {
      fileList.innerHTML = '';
      files.forEach((file) => {
        const fileElement = document.createElement('div');
        const filenameElement = document.createElement('span');
        filenameElement.textContent = file.filename;
        fileElement.appendChild(filenameElement);
        const openButton = document.createElement('button');
        openButton.textContent = 'Open';
        openButton.addEventListener('click', async () => {
          await this.openFile(file.id);
        });
        fileElement.appendChild(openButton);
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', async () => {
          await this.deleteFile(file.id);
        });
        fileElement.appendChild(deleteButton);
        fileList.appendChild(fileElement);
      });
    }
  }

  connectedCallback() {
    if (this.hasAttribute('verbose')) {
      this.innerHTML = `
        <h1>File Clerk</h1>
        <div class="file-list"></div>
      `;
      this.renderFileList();
    }
  }
}

customElements.define("file-clerk", FileClerk);
