'use strict';
/**
 * @module router/notes
 * @requires express
 */
const express = require('express');
const router = express.Router();
const { prisma } = require('../../prisma-database/generated/prisma-client');
const auth = require('../auth/middleware');
const control_notes = require('../models/controller/notes-controller');

/**
 * This function creates a new note in the database
 * @function POST
 * @param {string} path - Express Path
 * @param {function} callback - express callback
 * @returns { (Object | Error) } - the newly created note object
 */

router.post('/note', auth, control_notes.handleNewNote);


/**
 * This function gets all note data from database
 * @function GET
 * @param {string} path - express path
 * @param {function} callback - express callback
 * @returns { (Array | Error) } - an array of all notes
 */

router.get('/notes', auth, control_notes.handleGetNoteDataDB);

/**
 * This function gets a note from database
 * @function GET/:id
 * @param {string} path - express path
 * @param {function} callback - express callback
 * @returns { (Object | Error) } - a single note object
 */

router.get('/note/:id', auth, control_notes.handleGetNoteDB);

module.exports = router;