const PLAN_FEATURES = {
  basic: {
    maxTables: 5,
    maxStaff: 2,
    maxMenuItems: 30,
    maxCategories: 5,
    onlinePayments: false,
    advancedAnalytics: false,
    customerReviews: false,
    exportReports: false,
    prioritySupport: false,
  },
  pro: {
    maxTables: 20,
    maxStaff: 10,
    maxMenuItems: 200,
    maxCategories: 20,
    onlinePayments: true,
    advancedAnalytics: true,
    customerReviews: true,
    exportReports: true,
    prioritySupport: false,
  },
  enterprise: {
    maxTables: -1,
    maxStaff: -1,
    maxMenuItems: -1,
    maxCategories: -1,
    onlinePayments: true,
    advancedAnalytics: true,
    customerReviews: true,
    exportReports: true,
    prioritySupport: true,
  },
};

module.exports = { PLAN_FEATURES };
