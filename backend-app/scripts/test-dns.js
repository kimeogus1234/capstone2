const dns = require('dns').promises;

async function testDns() {
    console.log('Testing SRV resolution with Google DNS (8.8.8.8)...');
    try {
        const resolver = new (require('dns').promises.Resolver)();
        resolver.setServers(['8.8.8.8']); // Google DNS
        const results = await resolver.resolveSrv('_mongodb._tcp.cluster0.ed2xywd.mongodb.net');
        console.log('SRV Records found:', JSON.stringify(results, null, 2));
    } catch (err) {
        console.error('Google DNS SRV resolution failed:', err);
    }
}

testDns();
