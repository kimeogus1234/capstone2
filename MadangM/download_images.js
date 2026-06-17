const fs = require('fs');
const https = require('https');
const path = require('path');

const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 308) {
                return download(response.headers.location, dest).then(resolve).catch(reject);
            }
            if (response.statusCode >= 400) {
                return reject(new Error('Failed with status ' + response.statusCode + ' for ' + url));
            }
            const file = fs.createWriteStream(dest);
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(dest);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
};

const images = [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Watermelon_cross_section_2.jpg', name: 'watermelon_home.jpg' },
    { url: 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=500&q=80', name: 'salmon_home.jpg' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Daikon_radish.jpg', name: 'radish_home.jpg' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Pork_belly_-_raw.jpg', name: 'pork_home.jpg' }
];

const dir = path.join(__dirname, 'src', 'assets', 'images');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

Promise.all(images.map(img => download(img.url, path.join(dir, img.name))))
    .then(() => console.log('All images downloaded successfully.'))
    .catch(err => console.error('Error downloading:', err));
