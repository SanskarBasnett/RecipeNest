const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

/**
 * Downloads an image from a URL and saves it to the uploads folder.
 * Follows redirects correctly (opens write stream only on 200).
 * Returns the stored path string (e.g. "/uploads/filename.jpg") or null on failure.
 */
const downloadImage = (url, filename, redirects = 0) => {
  return new Promise((resolve) => {
    if (redirects > 10) { resolve(null); return; }

    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

    const dest = path.join(UPLOADS_DIR, filename);

    // Skip if already downloaded with content
    if (fs.existsSync(dest)) {
      try {
        if (fs.statSync(dest).size > 500) { resolve(`/uploads/${filename}`); return; }
      } catch (_) {}
      fs.unlinkSync(dest);
    }

    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, (response) => {
      // Follow redirects without opening a file stream
      if (response.statusCode === 301 || response.statusCode === 302) {
        response.resume();
        downloadImage(response.headers.location, filename, redirects + 1).then(resolve);
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        console.warn(`⚠️  Image download failed (${response.statusCode}): ${url}`);
        resolve(null);
        return;
      }

      // Open write stream only on 200
      const file = fs.createWriteStream(dest);
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(`/uploads/${filename}`); });
      file.on('error', (err) => {
        fs.unlink(dest, () => {});
        console.warn(`⚠️  Write error: ${err.message}`);
        resolve(null);
      });
    });

    request.on('error', (err) => {
      console.warn(`⚠️  Image download error: ${err.message}`);
      resolve(null);
    });

    request.setTimeout(20000, () => {
      request.destroy();
      console.warn(`⚠️  Image download timed out: ${url}`);
      resolve(null);
    });
  });
};

module.exports = downloadImage;
