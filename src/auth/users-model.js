'use strict';
/**
 * User Model
 * @module src/auth/users-model
 */

const jwt = require('jsonwebtoken');
const { prisma } = require('../../prisma-database/generated/prisma-client');

/**
 *
 * @param token
 * @returns {Promise<never>|void|Query}
 */
const authenticateToken = function(token) {
  try {
    let parsedToken = jwt.verify(token, process.env.SECRET);
    let query = {id: parsedToken.id};
    return prisma.user(query);
  } catch (error) {
    throw new Error('Invalid Token');
  }
};

/**
 *
 * @param type
 * @returns {undefined|*}
 */
const generateToken = (user, googleToken) => {
  console.log(user, googleToken);
  let token = {
    id: user.id,
    googleToken: googleToken,
  };

  let signOptions = { expiresIn: process.env.TOKEN_EXPIRE_TIME};
  return jwt.sign(token, process.env.SECRET, signOptions);
};

module.exports = {
  authenticateToken,
  generateToken,
};
