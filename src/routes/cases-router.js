'use strict';
/**
 * @module router/cases
 * @requires express
 */

let caseController = require('../models/controller/cases-controller');
const express = require('express');
const router = express.Router();
const { prisma } = require('../../prisma-database/generated/prisma-client');
const auth = require('../auth/middleware');


/**
 * This function creates a new case in the database
 * @function POST
 * @param {string} path - Express Path
 * @param {function} callback - express callback
 * @returns { (Object | Error) } - the newly created case object
 */

router.post('/case', auth, caseController.handleNewCase);


/**
 * This function gets all case data from database
 * @function GET
 * @param {string} path - express path
 * @param {function} callback - express callback
 * @returns { (Array | Error) } - an array of all cases
 */

router.get('/cases', caseController.handleGetAllCases);


/**
 * This function gets a case from database
 * @function GET/:id
 * @param {string} path - express path
 * @param {function} callback - express callback
 * @returns { (Object | Error) } - a single case object
 */
router.get('/case/:id', auth, caseController.handleGetCaseById);


/**
 * This function gets a case from database
 * @function PATCH/:id
 * @param {string} path - express path
 * @param {function} callback - express callback
 * @returns { (Object | Error) } - a single case object that was created
 */
router.patch('/case/:id', auth, caseController.getCaseFromDB);


module.exports = router;