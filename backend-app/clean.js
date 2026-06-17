const mongoose = require('mongoose');
const FloorMap = require('./src/models/FloorMap');
const MapMarker = require('./src/models/MapMarker');
const uri = 'mongodb+srv://ytv666666_db_user:5856HBuVvURCKLEr@cluster0.ed2xywd.mongodb.net/a00';

mongoose.connect(uri).then(async () => {
    await FloorMap.deleteMany({ floor: { $in: ['B1', '1F', '2F', '3F'] } });
    await MapMarker.deleteMany({ label: { $in: ['마당M 푸드', '푸드 홀'] } });
    console.log('Cleaned up!');
    process.exit(0);
});
