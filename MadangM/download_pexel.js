const fs = require('fs');
const https = require('https');
const path = require('path');

const fetchPexelsImageUrl = (query) => {
    return new Promise((resolve, reject) => {
        https.get('https://www.pexels.com/search/' + query + '/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        }, res => {
            let data = '';
            res.on('data', c => { data += c; });
            res.on('end', () => {
                const matches = data.match(/https:\/\/images\.pexels\.com\/photos\/\d+\/pexels-photo-\d+\.jpeg/g);
                if (matches && matches.length > 0) resolve(matches[0]);
                else reject(new Error('No image found for ' + query));
            });
        }).on('error', reject);
    });
};

const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                return download(response.headers.location, dest).then(resolve).catch(reject);
            }
            if (response.statusCode >= 400) {
                return reject(new Error('Failed ' + response.statusCode));
            }
            const file = fs.createWriteStream(dest);
            response.pipe(file);
            file.on('finish', () => resolve(dest));
        }).on('error', reject);
    });
};

async function main() {
    const dir = path.join(__dirname, 'src', 'assets', 'images');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    try {
        const watermelon = await fetchPexelsImageUrl('watermelon');
        console.log('Watermelon:', watermelon);
        await download(watermelon + '?auto=compress&cs=tinysrgb&w=400', path.join(dir, 'watermelon_home.jpg'));

        const radish = await fetchPexelsImageUrl('radish');
        console.log('Radish:', radish);
        await download(radish + '?auto=compress&cs=tinysrgb&w=400', path.join(dir, 'radish_home.jpg'));

        const pork = await fetchPexelsImageUrl('raw-meat');
        console.log('Pork:', pork);
        await download(pork + '?auto=compress&cs=tinysrgb&w=400', path.join(dir, 'pork_home.jpg'));

        console.log('Images successfully downloaded.');
    } catch (e) {
        console.error(e);
    }
}

main();
