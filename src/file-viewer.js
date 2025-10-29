import DataroomElement from "dataroom-js";

/**
 * File Viewer Component
 *
 * A custom element that renders different types of files by parsing their MIME type
 * from Data URLs. Supports images, videos, audio, PDFs, and text files.
 *
 * @class FileViewer
 * @extends DataroomElement
 * 
 * @example
 * // HTML usage:
 * <file-viewer></file-viewer>
 * 
 * // JavaScript usage:
 * const viewer = document.querySelector('file-viewer');
 * viewer.openFile('data:image/jpeg;base64,/9j/4AAQ...');
 */
class FileViewer extends DataroomElement {
  /**
   * Opens and renders a file based on its Data URL
   * Parses the MIME type from the Data URL and renders the file accordingly
   * @param {string} fileDataUrl - The Data URL of the file to display
   * @returns {void}
   */
  openFile(fileDataUrl) {
    // Extract the file type from the data URL
    const fileType = fileDataUrl.split(":")[1].split(";")[0];

    // Render the file based on its type
    switch (fileType) {
      case "image/jpeg":
      case "image/png":
      case "image/webp":
        this.renderImage(fileDataUrl);
        break;
      case "video/mp4":
        this.renderVideo(fileDataUrl);
        break;
      case "audio/mpeg":
        this.renderAudio(fileDataUrl);
        break;
      case "application/pdf":
        this.renderPdf(fileDataUrl);
        break;
      case "text/plain":
        this.renderText(fileDataUrl);
        break;
      default:
        console.error("Unsupported file type:", fileType);
    }
  }

  /**
   * Renders an image file in the viewer
   * @param {string} fileDataUrl - The Data URL of the image file
   * @returns {void}
   */
  renderImage(fileDataUrl) {
    this.clear();
    const img = this.create("img", {
      src: fileDataUrl
    });
  }

  /**
   * Renders a video file in the viewer with playback controls
   * @param {string} fileDataUrl - The Data URL of the video file
   * @returns {void}
   */
  renderVideo(fileDataUrl) {
    this.clear();
    const video = this.create("video", {
      controls: true,
      src: fileDataUrl
    });
  }

  /**
   * Renders an audio file in the viewer with playback controls
   * @param {string} fileDataUrl - The Data URL of the audio file
   * @returns {void}
   */
  renderAudio(fileDataUrl) {
    this.clear();
    const audio = this.create("audio", {
      controls: true,
      src: fileDataUrl
    });
  }

  /**
   * Renders a text file in the viewer
   * Fetches the text content from the Data URL and displays it in a pre-formatted element
   * @param {string} fileDataUrl - The Data URL of the text file
   * @returns {void}
   */
  renderText(fileDataUrl) {
    this.clear();
    try {
      // Extract the base64 data from the data URL
      const base64Data = fileDataUrl.split(',')[1];
      const text = atob(base64Data);
      const pre = this.create("pre", {
        content: text
      });
    } catch (error) {
      console.error("Error loading text file:", error);
      const pre = this.create("pre", {
        content: "Error decoding text file"
      });
    }
  }

  /**
   * Renders a PDF file in the viewer using an embed element
   * @param {string} fileDataUrl - The Data URL of the PDF file
   * @returns {void}
   */
  renderPdf(fileDataUrl) {
    this.clear();
    const embed = this.create("embed", {
      src: fileDataUrl,
      type: "application/pdf"
    });
  }

  /**
   * Clears all child elements from the viewer
   * @returns {void}
   */
  clear() {
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }
  }
}

customElements.define("file-viewer", FileViewer);
