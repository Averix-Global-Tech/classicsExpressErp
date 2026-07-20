const { body } = require('express-validator');

const PASSWORD_RULES = [
  'Password must be 8–64 characters and include upper, lower, number, and symbol.',
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}$/,
];

const passwordChain = () =>
  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 8, max: 64 })
    .withMessage('Password must be 8–64 characters.')
    .matches(PASSWORD_RULES[1])
    .withMessage(PASSWORD_RULES[0]);

const login = [body('email').isEmail().withMessage('A valid email is required.'), passwordChain()];

const forgotPassword = [body('email').isEmail().withMessage('A valid email is required.')];

const resetPassword = [
  body('token').notEmpty().withMessage('Reset token is required.'),
  passwordChain(),
];

const changePassword = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  passwordChain(),
];

module.exports = { authValidator: { login, forgotPassword, resetPassword, changePassword } };
