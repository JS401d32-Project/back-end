'use strict';
/**
 * @module router/contacts
 * @requires express
 * @requires fuzzy-search
 */

const express = require('express');
const router = express.Router();
const auth = require('../auth/middleware');
const contacts_controller = require('../models/controller/contacts-controller');


/**
 * This function creates a new contact in the database.
 * 
 * @function POST
 * @param {string} path - Express Path
 * @param {function} callback - express callback
 * @returns { (Object | Error) } - the newly created contact object
 */
router.post('/contact', auth, contacts_controller.create);

/**
 * This function gets all contacts data from database.
 * 
 * @function GET
 * @example <caption>Example query string</caption>
 * localhost:4000/contacts/?name=john
 * returns all contacts that have John in the first or last name
 * fields filtered and sorted by fuzzy search.
 * 
 * @param {string} path - express path - *optional name query field
 * @param {function} callback - express callback
 * @returns { (Array | Error) } - an array of all contacts optionally
 * filtered by 'name' query
 */
router.get('/contacts', auth, contacts_controller.get);

/**
 * This function gets a contact from database.
 * 
 * @function GET/:id
 * @param {string} path - express path
 * @param {function} callback - express callback
 * @returns { (Object | Error) } - a single contact object
 */
router.get('/contact/:id', auth, contacts_controller.getByID);

router.get('/googleContacts', auth, contacts_controller.fetch);
router.post('/importGoogleContacts', auth, contacts_controller.import);

module.exports = router;
