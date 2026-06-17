const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/madangm', {useNewUrlParser: true, useUnifiedTopology: true}).then(async () => {
    const ConditionalReward = require('./src/models/ConditionalReward');
    await ConditionalReward.updateMany({}, { $set: { 'reward.coupon_id': '69f98d15ac59f6b46bb3d364' } });
    console.log('Updated rules to use valid coupon.');
    process.exit(0);
});
