class FileViewer extends HTMLElement {
  constructor() {
    super();
  }
  
  openFile(fileDataUrl) {
    // extract the file type from the data URL
    const fileType = fileDataUrl.split(':')[1].split(';')[0];
    
    // render the file based on its type
    switch (fileType) {
      case 'image/jpeg':
      case 'image/png':
        this.renderImage(fileDataUrl);
        break;
      case 'video/mp4':
        this.renderVideo(fileDataUrl);
        break;
      case 'audio/mpeg':
        this.renderAudio(fileDataUrl);
        break;
      case 'application/pdf':
        this.renderPdf(fileDataUrl);
        break;
      case 'text/plain':
        this.renderText(fileDataUrl);
        break;
      default:
        console.error('Unsupported file type:', fileType);
    }
  }

  renderImage(fileDataUrl) {
    const img = document.createElement('img');
    img.src = fileDataUrl;
    this.clear();
    this.appendChild(img);
  }
  
  renderVideo(fileDataUrl) {
    const video = document.createElement('video');
    video.controls = true;
    video.src = fileDataUrl;
    this.clear();
    this.appendChild(video);
  }
  
  renderAudio(fileDataUrl) {
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.src = fileDataUrl;
    this.clear();
    this.appendChild(audio);
  }
  
  renderText(fileDataUrl) {
    fetch(fileDataUrl)
      .then(response => response.text())
      .then(text => {
        const pre = document.createElement('pre');
        pre.textContent = text;
        this.clear();
        this.appendChild(pre);
      })
      .catch(error => {
        console.error('Error loading text file:', error);
      });
  }

  renderPdf(fileDataUrl) {
    const embed = document.createElement('embed');
    embed.src = fileDataUrl;
    embed.type = 'application/pdf';
    this.clear();
    this.appendChild(embed);
  }

  
  clear() {
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }
  }
}

customElements.define('file-viewer', FileViewer);
