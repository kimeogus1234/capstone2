require('dotenv').config();
const { connectMongoDB } = require('./src/config/mongo');
const Cart = require('./src/models/Cart');

connectMongoDB().then(async () => {
  const orders = await Cart.find({ status: { $ne: 'CART' } });
  orders.forEach(o => {
    console.log('=== 주문 ===');
    console.log('orderId:', o.orderId);
    console.log('status:', o.status);
    console.log('userId:', o.userId);
    o.items.forEach(item => {
      console.log('  - name:', item.name, '| price:', item.price, '| qty:', item.quantity);
    });
    console.log('');
  });
  process.exit(0);
}).catch(console.error);
