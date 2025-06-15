
/**
 * Node.js script: Run with `node github/export_books_to_static.js`
 * Requires: @supabase/supabase-js, fs, path, https
 * Purpose: Download all books & images from Supabase DB to github/books.json and github/images/
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://pijhrmuamnwdgucfnycl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpamhybXVhbW53ZGd1Y2ZueWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDk1NTAsImV4cCI6MjA2MDgyNTU1MH0.qf5P5eWDSLRmFKxIwtqBygxNAvIFtqGxJN3J4nX7ocE';
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
    // Try to download image if imageurl exists and is http(s)
    let localImage = '';
    if (book.imageurl && /^https?:\/\//.test(book.imageurl)) {
      // Save image as images/{book.id}.{ext}
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
