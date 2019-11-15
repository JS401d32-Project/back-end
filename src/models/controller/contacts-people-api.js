'use strict';

const superagent = require('superagent');
const { prisma } = require('../../../prisma-database/generated/prisma-client');

/** 
 * This function imports the contact(s) fetched from google contacts  
 * using the People API
 * 
 * @param {object} - peeps - The contact object we are importing to the
 * database
 * @returns {object} - returns all the new contacts we have imported
 * into the database
 */
const importContacts = async (peeps) => {  
  // Let's do an array of creates, these are all promises
  const creates = peeps.map(peep => {
    return prisma.createContact(peep)
      .catch((err) => {
        console.log('Not creating contact (may already exist):', err);
      });
  });
  // await on all the creates
  return await Promise.all(creates);
};

// This is to clear out null values --> we don't want to store nulls in the database
const emptyIfNull = (val) => val ? val : '';

/**
 * This function will fetch all of the user's contacts from the people
 * API.
 * 
 * @param {string} googleToken
 * @returns {Array} - contact object array
 */
const fetchContacts = (googleToken) => {
  // This query gets all contacts
  // people/me/connections gets all of the contacts belonging to "me" (user)
  return superagent.get('https://people.googleapis.com/v1/people/me/connections')
    .set('Authorization', `Bearer ${googleToken}`)
    .query({ personFields: 'names,emailAddresses' })
    .then(googleResponse => {
      const peeps = googleResponse.body.connections.map(generatePrismaContact);
      return peeps;
    })
    .catch(error => {
      console.log('Error fetching contacts', error);
    });
};

/**
 * Based on the given Google contact data, generate the
 * corresponding contact data record in the form we would
 * store in the DB.
 *
 * @param {Object} googleContact - Contact data from Google People API
 * @returns {Object} - Contact data in the form we would store in the DB
 */
const generatePrismaContact = (googleContact) => {
  // This works when we do people/me/connections
  // to get a list of people with name/email
  // more data (personFields) per contact can be retrieved if desired - a full list can be found here: https://developers.google.com/people/api/rest/v1/people.connections/list
  const c = googleContact;
  return {
    // googleResourceName is defined in the database as @unique.
    // Prisma will ensure this requirement is met at all times.
    googleResourceName: c.resourceName,
    firstName: emptyIfNull(c.names[0].givenName),
    lastName: emptyIfNull(c.names[0].familyName),
    emailMain: emptyIfNull(c.emailAddresses ? c.emailAddresses[0].value : null),
  };
};

/**
 * This function will create a new contact in Google Contacts using the 
 * People API.
 * This will be done when a new contact is created using the /contact 
 * route.
 * 
 * @param {string} googleToken - 
 * @param {Object} prismaContact - Contact data in the form we receive from the front end or the DB
 * @returns {String} - The unique ID assigned by Google for the new Google contact
 */
const postContact = (googleToken, prismaContact) => {
  const googleContactData = generateGoogleContact(prismaContact);
  return superagent.post('https://people.googleapis.com/v1/people:createContact')
    .set('Authorization', `Bearer ${googleToken}`)
    .send(googleContactData)
    .then(googleResponse => {
      const personId = googleResponse.body.resourceName;
      console.log('======> New Google Contact:', googleResponse.body);
      console.log('======> Google Unique Person ID:', personId);
      return personId;
    })
    .catch(error => {
      console.log('Error posting contacts', error);
    });
};

/**
 * Based on the given contact data in the form we would store in the DB,
 * generate the corresponding Google contact data record.
 *
 * @param {Object} prismaContact - Contact data in the form we receive from the front end or the DB
 * @returns {Object} - Contact data formated as the Google People API will receive it
 */
const generateGoogleContact = (prismaContact) => {
  const c = prismaContact;
  const googleContactData =
  {
    names: [{
      givenName: c.firstName,
      familyName: c.lastName,
    }],
    birthdays: [{
      text: c.birthdate,
    }],
    addresses: [
      {
        type: 'home',
        streetAddress: c.homeStreet,
        extendedAddress: c.homeStreet2,
        city: c.homeCity,
        region: c.homeState,
        postalCode: c.homeZip,
      },
      {
        type: 'work',
        streetAddress: c.workStreet,
        extendedAddress: c.workStreet2,
        city: c.workCity,
        region: c.workState,
        postalCode: c.workZip,
      },
    ],
    organizations: [{
      type: 'work',
      name: c.workCompanyName,
    }],
    phoneNumbers: [
      // TODO: Front end defines primary and secondary phone rather than home and work
      {
        type: 'home',
        value: c.primaryPhone || c.homePhone,
      },
      {
        type: 'work',
        value: c.secondaryPhone || c.workPhone,
      },
      {
        type: 'mobile',
        value: c.mobilePhone || c.cellPhone,
      },
      {
        type: 'otherFax',
        value: c.fax,
      },
    ],
    emailAddresses: [
      // TODO: Front end defines main and backup email rather than home and work
      {
        type: 'other',
        value: c.emailMain,
      },
      {
        type: 'other',
        value: c.emailBackup,
      },
    ],
  };
  
  return googleContactData;
};

module.exports = {
  fetchContacts,
  importContacts,
  postContact,
};
