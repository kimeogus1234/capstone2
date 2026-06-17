const https = require('https');

const fetchUnsplash = (query) => {
    https.get('https://unsplash.com/s/photos/' + query, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, res => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
            console.log(`[DEBUG] Data length: ${data.length}`);
            if (data.length < 500) console.log(`[DEBUG] Data: ${data}`);
            // looking for something like "public_domain":false,"id":"ABCDEFG","slug"
            // We can just find "id":" and extract the 11 character string
            const regex = /\"id\"\:\"([a-zA-Z0-9_-]{10,13})\"/g;
            let match;
            let found = [];
            while ((match = regex.exec(data)) !== null) {
                if (match[1].length > 10) found.push(match[1]);
            }
            if (found.length > 0) {
                console.log(query + ':', found[0], found[1], found[2]);
            } else {
                console.log(query + ': not found');
            }
        });
    });
};

fetchUnsplash('watermelon');
fetchUnsplash('radish');
fetchUnsplash('pork-belly');
