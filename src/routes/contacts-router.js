'use strict';
/**
 * @module router/contacts
 * @requires express
 * @requires fuzzy-search
 */

const FuzzySearch = require('fuzzy-search');
const express = require('express');
const router = express.Router();
const { prisma } = require('../../prisma-database/generated/prisma-client');
const auth = require('../auth/middleware');
const people_api = require('../models/controller/contacts-people-api');
const contacts_controller = require('../models/controller/contacts-controller');


/**
 * This function creates a new contact in the database
 * @function POST
 * @param {string} path - Express Path
 * @param {function} callback - express callback
 * @returns { (Object | Error) } - the newly created contact object
 */

router.post('/contact', auth, contacts_controller.handleCreateNewContact);

/**
 * This function gets all constact data from database
 * @function GET
 * @example <caption>Example query string</caption>
 * localhost:4000/constact/?name=john
 * returns all constacts that have John in the first or last name fields
 * filtered and sorted by fuzzy search
 * @param {string} path - express path - *optional name query field
 * @param {function} callback - express callback
 * @returns { (Array | Error) } - an array of all constacts optionally filtered by 'name' query
 */
router.get('/contacts', auth, contacts_controller.handleGetContactsFromDB);

/**
 * This function gets a contact from database
 * @function GET/:id
 * @param {string} path - express path
 * @param {function} callback - express callback
 * @returns { (Object | Error) } - a single contact object
 */
router.get('/contact/:id', auth, contacts_controller.handleGetContactByID);


router.get('/googleContacts', auth, people_api.fetch);
router.post('/importGoogleContacts', auth, people_api.import);

module.exports = router;
