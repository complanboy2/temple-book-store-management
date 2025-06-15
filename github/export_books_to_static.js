/**
 * Node.js script: Run with `node github/export_books_to_static.js`
 * Requires: @supabase/supabase-js, fs, path, https
 * Purpose: Download all books & images from Supabase DB to github/books.json and github/images/
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

// ---- REMOVE YOUR SUPABASE CREDENTIALS ----
const SUPABASE_URL = ""; // <-- Enter your Supabase URL or set via env
const SUPABASE_ANON_KEY = ""; // <-- Enter your Supabase anon key or set via env

const IMAGE_FOLDER = path.resolve(__dirname, 'images');
const BOOKS_JSON_PATH = path.resolve(__dirname, 'books.json');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https') ? https : http;
    client.get(url, response => {
      if (response.statusCode !== 200) {
        fs.unlink(dest, () => {});
        return reject(new Error(`Failed to get image: ${url}`));
      }
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

(async () => {
  if (!fs.existsSync(IMAGE_FOLDER)) fs.mkdirSync(IMAGE_FOLDER);

  const { data: books, error } = await supabase.from('books').select('*');
  if (error) throw error;

  for (const book of books) {
    let localImage = '';
    if (book.imageurl && /^https?:\/\//.test(book.imageurl)) {
      const ext = path.extname(book.imageurl.split('?')[0]) || '.jpg';
      const localPath = path.join(IMAGE_FOLDER, `${book.id}${ext}`);
      try {
        await downloadImage(book.imageurl, localPath);
        localImage = `images/${book.id}${ext}`;
        book.imageurl = localImage;
        console.log(`Downloaded image for "${book.name}": ${localImage}`);
      } catch (e) {
        console.warn(`Failed to download image for "${book.name}", using placeholder.`);
        book.imageurl = '';
      }
    }
    // If image not present or not a URL, will be handled by placeholder
  }

  fs.writeFileSync(BOOKS_JSON_PATH, JSON.stringify(books, null, 2));
  console.log(`Exported ${books.length} books to books.json`);
})();
