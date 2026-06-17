const Order = require('../models/Order');
const Store = require('../models/Store');
const Product = require('../models/Product');
const User = require('../models/User');

exports.getDashboardStats = async (req, res) => {
    try {
        // 1. 전체 요약 데이터 (Parallel 실행으로 성능 최적화)
        const [orderStats, storeCount, productCount, userCount] = await Promise.all([
            Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalSales: { $sum: { $toDouble: "$totalAmount" } },
                        orderCount: { $sum: 1 },
                        pendingCount: { 
                            $sum: { 
                                $cond: [{ $in: ["$status", ["PAID", "PREPARING", "SHIPPING"]] }, 1, 0] 
                            } 
                        }
                    }
                }
            ]),
            Store.countDocuments({ type: 'STORE' }),
            Product.countDocuments(),
            User.count()
        ]);

        const summary = orderStats[0] || { totalSales: 0, orderCount: 0, pendingCount: 0 };

        // 2. 최근 7일 매출 트렌드
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const salesTrend = await Order.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    dailySales: { $sum: { $toDouble: "$totalAmount" } },
                    dailyOrders: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.json({
            summary: {
                totalSales: summary.totalSales,
                orderCount: summary.orderCount,
                pendingOrders: summary.pendingCount,
                storeCount,
                productCount,
                userCount
            },
            salesTrend
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
