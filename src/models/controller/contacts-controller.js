'use strict';
/**
 * @module controller/contacts
 * @requires express
 * @requires fuzzy-search
 */

// alternatively, you can used the cookie line below as opposed to the authorization header, but cookies are not implemented on the front end as of now.
// const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const FuzzySearch = require('fuzzy-search');
const { prisma } = require('../../../prisma-database/generated/prisma-client');

const {
  postContact,
  fetchContacts,
  importContacts,
} = require('./contacts-people-api');

/** 
 * This function is used for both fetching the contacts, and also the
 * function that fetches and imports contacts to the database.
 *
 * @param {Object} request
 * @param {Object} response
 * @returns {object} - the contacts from the People API
 */
const handleFetchContacts = async (request, response) => {
  // alternatively, you can used the cookie line below as opposed to the authorization header, but cookies are not implemented on the front end as of now.
  // const signed_token = request.cookies['X-401d19-OAuth-token'];
  let [, signed_token] = request.headers.authorization.split(/\s+/);

  const token = jwt.verify(signed_token, process.env.SECRET);

  const peeps = await fetchContacts(token.googleToken);
  response.json(peeps);
};

/**
 * This function imports the fetched contacts into the prisma database
 * 
 * @param {request}
 * @returns {object} - the imported contacts
 */
const handleImportContacts = async (request, response) => {
  // alternatively, you can used the cookie line below as opposed to the authorization header, but cookies are not implemented on the front end as of now.
  // const signed_token = request.cookies['X-401d19-OAuth-token'];
  let [, signed_token] = request.headers.authorization.split(/\s+/);

  const token = jwt.verify(signed_token, process.env.SECRET);
  const peeps = await fetchContacts(token.googleToken);
  const imported_peeps = await importContacts(peeps);
  // we're also going to save them to the database
  // we will get nulls if they already exist in the database
  // we don't want to show nulls, so we use filter
  response.json(imported_peeps.filter(x => x));
};


/**
 * This function creates a new contact in the database and a
 * corresponding Google contact in the Google account of the user.
 * 
 * @function POST
 * @param {string} path - Express Path
 * @param {function} callback - express callback
 * @returns { (Object | Error) } - the newly created contact object
 */
async function handleCreateNewContact(req, res) {
  // alternatively, you can used the cookie line below as opposed to the authorization header, but cookies are not implemented on the front end as of now.
  // const signed_token = req.cookies['X-401d19-OAuth-token'];
  let [, signed_token] = req.headers.authorization.split(/\s+/);
  console.log('=====> signed_token', signed_token);
  const googleToken = jwt.verify(signed_token, process.env.SECRET).googleToken;
  console.log('=====> googleToken', googleToken);

  console.log('req.body ========> ', req.body);
  

  const givenName = req.body.firstName;
  const familyName = req.body.lastName;
  const personId = await postContact(googleToken, givenName);
  console.log('googlePerson  ========>', personId);
  req.body.googleResourceName = personId;
  console.log('req.body ========> ', req.body);

  const newContact = await prisma.createContact(req.body);
  console.log('prisma newContact ========>', newContact);

  res.json(newContact);
}

/**
 * This function will create a new contact in Google Contacts using the
 * People API. This will be done when a new contact is created using 
 * the /contact route.  Therefore, the contact info will be in the 
 * prisma database as well as  Google Contacts.
 * 
 * @param {Object} - will contain the new contact entry
 * @returns {String} - The unique ID assigned by Google for the new Google contact
 */
const handlePostGoogleContact = async (req, res) => {
  // alternatively, you can used the cookie line below as opposed to the authorization header, but cookies are not implemented on the front end as of now.
  // const signed_token = req.cookies['X-401d19-OAuth-token'];
  let [, signed_token] = req.headers.authorization.split(/\s+/);
  console.log('=====> signed_token', signed_token);
  const googleToken = jwt.verify(signed_token, process.env.SECRET).googleToken;
  console.log('=====> googleToken', googleToken);

  const givenName = req.body.firstName;
  const familyName = req.body.lastName;
  const phoneNumbers = [req.body.cellPhone, req.body.workPhone, req.body.homePhone];
  const emailAddresses = [req.body.emailMain, req.body.emailBackup]; // TODO: emailAddresses

  const personId = await postContact(googleToken, givenName, emailAddresses, phoneNumbers);

  res.json(personId);
};

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
async function handleGetContactsFromDB(req, res) {
  // if body has a search and name property set
  let nameToFilterBy = req.query && req.query.name;
  console.log(nameToFilterBy);
  // get all contacts
  const contacts = await prisma.contacts();
  // filter contacts by nameToFilterBy
  const searcher = new FuzzySearch(contacts, ['firstName', 'lastName'], {
    caseSensitive: false,
    sort: true,
  });
  const result = searcher.search(nameToFilterBy);
  // return filtered list of contacts
  res.json(result);
}

/**
 * This function gets a contact from database
 * @function GET/:id
 * @param {string} path - express path
 * @param {function} callback - express callback
 * @returns { (Object | Error) } - a single contact object
 */
async function handleGetContactByID(req, res){
  const contact = await prisma.contact({ id: req.params.id });
  res.json(contact);
}

module.exports = {
  create: handleCreateNewContact,
  get: handleGetContactsFromDB,
  getByID: handleGetContactByID,
  fetch: handleFetchContacts,
  import: handleImportContacts,
};
