const { body } = require('express-validator');
const { ROLES } = require('../config/constants/roles');

const passwordChain = () =>
  body('password')
    .optional()
    .isLength({ min: 8, max: 64 })
    .withMessage('Password must be 8–64 characters.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}$/)
    .withMessage('Password must include upper, lower, number, and symbol.');

const createUser = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters.'),
  body('email').isEmail().withMessage('A valid email is required.'),
  passwordChain(), // optional on update, required handled in controller
  body('role')
    .optional()
    .isIn(Object.values(ROLES))
    .withMessage('Invalid role.'),
  body('phone')
    .optional()
    .matches(/^[+]?[\d\s()-]{6,20}$/)
    .withMessage('Phone must be 6–20 digits.'),
];

const updateUser = [
  body('name').optional().trim().isLength({ min: 2, max: 80 }),
  body('email').optional().isEmail(),
  passwordChain(),
  body('role').optional().isIn(Object.values(ROLES)),
  body('phone')
    .optional()
    .matches(/^[+]?[\d\s()-]{6,20}$/)
    .withMessage('Phone must be 6–20 digits.'),
  body('isActive').optional().isBoolean(),
];

module.exports = { userValidator: { createUser, updateUser } };
