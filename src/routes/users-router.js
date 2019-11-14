'use strict';
/**
 * @module router/users
 * @requires express
 */

const express = require('express');
const router = express.Router();
const { prisma } = require('../../prisma-database/generated/prisma-client');
const auth = require('../auth/middleware');
const user_controller = require('../models/controller/users-controller');

/**
 * This function creates a new user in the database
 * @function POST
 * @param {string} path - Express Path
 * @param {function} callback - express callback
 * @returns { (Object | Error) } - the newly created user object
 */

router.post('/user', auth, user_controller.handleCreateNewUser);

/**
 * This function gets all user data from database
 * @function GET
 * @param {string} path - express path
 * @param {function} callback - express callback
 * @returns { (Array | Error) } - an array of all users
 */

router.get('/users', auth, user_controller.handleGetUserDataDB);

/**
 * This function gets a user from database
 * @function GET/:id
 * @param {string} path - express path
 * @param {function} callback - express callback
 * @returns { (Object | Error) } - a single user object
 */

router.get('/user/:id', auth, user_controller.handleGetUserFromDB);

module.exports = router;