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
 * @param {string} - googleToken
 * @returns {object} - contact object
 */
const fetchContacts = (googleToken) => {
  // This query gets all contacts
  // people/me/connections gets all of the contacts belonging to "me" (user)
  return superagent.get('https://people.googleapis.com/v1/people/me/connections')
    .set('Authorization', `Bearer ${googleToken}`)
    .query({ personFields: 'names,emailAddresses' })
    .then(googleResponse => {
      
      // This works when we do people/me/connections
      // to get a list of people with name/email
      // more data (personFields) per contact can be retrieved if desired - a full list can be found here: https://developers.google.com/people/api/rest/v1/people.connections/list
      const peeps = googleResponse.body.connections.map(connection => {
        return {
          id: Number(connection.resourceName.replace('people/c', '')),
          firstName: emptyIfNull(connection.names[0].givenName),
          lastName: emptyIfNull(connection.names[0].familyName),
          emailMain: emptyIfNull(connection.emailAddresses ? connection.emailAddresses[0].value : null),
        };
      });
      return peeps;
    })
    .catch(error => {
      console.log('Error fetching contacts', error);
    });
};

/**
 * This function will create a new contact in Google Contacts using the 
 * People API.
 * This will be done when a new contact is created using the /contact 
 * route.
 * 
 * @param {string} - googleToken, givenName, email Addresses, 
 * phoneNumbers
 * @returns {String} - The unique ID assigned by Google for the new Google contact
 */
const postContact = (googleToken, givenName, emailAddresses, phoneNumbers) => {
  // This query gets all contacts
  return superagent.post('https://people.googleapis.com/v1/people:createContact')
    .set('Authorization', `Bearer ${googleToken}`)
    .send({
      'names': [{ givenName }],
      'emailAddresses': [{ 'value': 'testemail@gmail.com' }],
      'phoneNumbers': phoneNumbers,

      // {
      //   "resourceName": string,
      //   "etag": string,
      //   "metadata": {
      //     object (PersonMetadata)
      //   },
      //   "locales": [
      //     {
      //       object (Locale)
      //     }
      //   ],
      //   "names": [
      //     {
      //       object (Name)
      //     }
      //   ],
      //   "nicknames": [
      //     {
      //       object (Nickname)
      //     }
      //   ],
      //   "coverPhotos": [
      //     {
      //       object (CoverPhoto)
      //     }
      //   ],
      //   "photos": [
      //     {
      //       object (Photo)
      //     }
      //   ],
      //   "genders": [
      //     {
      //       object (Gender)
      //     }
      //   ],
      //   "ageRange": enum (AgeRange),
      //   "ageRanges": [
      //     {
      //       object (AgeRangeType)
      //     }
      //   ],
      //   "birthdays": [
      //     {
      //       object (Birthday)
      //     }
      //   ],
      //   "events": [
      //     {
      //       object (Event)
      //     }
      //   ],
      //   "addresses": [
      //     {
      //       object (Address)
      //     }
      //   ],
      //   "residences": [
      //     {
      //       object (Residence)
      //     }
      //   ],
      //   "emailAddresses": [
      //     {
      //       object (EmailAddress)
      //     }
      //   ],
      //   "phoneNumbers": [
      //     {
      //       object (PhoneNumber)
      //     }
      //   ],
      //   "imClients": [
      //     {
      //       object (ImClient)
      //     }
      //   ],
      //   "taglines": [
      //     {
      //       object (Tagline)
      //     }
      //   ],
      //   "biographies": [
      //     {
      //       object (Biography)
      //     }
      //   ],
      //   "urls": [
      //     {
      //       object (Url)
      //     }
      //   ],
      //   "organizations": [
      //     {
      //       object (Organization)
      //     }
      //   ],
      //   "occupations": [
      //     {
      //       object (Occupation)
      //     }
      //   ],
      //   "interests": [
      //     {
      //       object (Interest)
      //     }
      //   ],
      //   "skills": [
      //     {
      //       object (Skill)
      //     }
      //   ],
      //   "braggingRights": [
      //     {
      //       object (BraggingRights)
      //     }
      //   ],
      //   "relations": [
      //     {
      //       object (Relation)
      //     }
      //   ],
      //   "relationshipInterests": [
      //     {
      //       object (RelationshipInterest)
      //     }
      //   ],
      //   "relationshipStatuses": [
      //     {
      //       object (RelationshipStatus)
      //     }
      //   ],
      //   "memberships": [
      //     {
      //       object (Membership)
      //     }
      //   ],
      //   "userDefined": [
      //     {
      //       object (UserDefined)
      //     }
      //   ],
      //   "sipAddresses": [
      //     {
      //       object (SipAddress)
      //     }
      //   ]
      // }

    })
    .then(googleResponse => {
      const personId = googleResponse.body.resourceName;
      console.log('======> Person', personId);
      
      return personId;
    })
    .catch(error => {
      console.log('Error posting contacts', error);
    });
};

module.exports = {
  fetchContacts,
  importContacts,
  postContact,
};
