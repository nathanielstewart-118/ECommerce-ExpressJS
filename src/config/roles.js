const allRoles = {
  user: ['getProducts', 'manageOwnProfile', 'createOrder', 'viewOwnOrders'],
  admin: [
    'getUsers',
    'manageUsers',
    'getProducts',
    'manageProducts',
    'getOrders',
    'manageOrders',
    'manageOwnProfile',
    'createOrder',
    'viewOwnOrders',
    'viewAnalytics',
    'manageSettings',
  ],
  moderator: [
    'getUsers',
    'getProducts',
    'manageProducts',
    'getOrders',
    'manageOwnProfile',
    'viewOwnOrders',
  ],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
