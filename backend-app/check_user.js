require('dotenv').config();
const User = require('./src/models/User');

async function checkUser() {
    try {
        const user = await User.findOne({ where: { username: 'lsj2649' } });
        console.log(user ? 'EXIST' : 'NOT_EXIST');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkUser();
