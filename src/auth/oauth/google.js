'use strict';

const superagent = require('superagent');
const Users = require('../users-model.js');
const { prisma } = require('../../../prisma-database/generated/prisma-client');

/**
 * Retrieves a session token for a user associated with the authorizing Google
 * profile. This creates a user model in the database if one doesn't exist.
 * @param request
 * @returns {Promise}
 */
const authorize = (request) => {
  const googleData = {
    code: request.query.code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: `${process.env.API_URL}/oauth`,
    grant_type: 'authorization_code',
  };
  // STEP 1: POST request for access token  
  return superagent.post('https://oauth2.googleapis.com/token')
    .type('form')
    .send(googleData)

    // STEP 2: GET request for Google user data
    // Note that "response" is NOT the response to the client, it is the response 
    //   WE got from google. so we can't send anything to the client here.
    .then((response) => {
        
      // this actually needs to me just /people/me
      // and you need to select the user email and id so we can create the 
      // user in prisma
        
      const token = response.body.access_token;

      // Let's store it in googleData until the last step
      googleData.token = token;
      return superagent.get('https://people.googleapis.com/v1/people/me')
        .query({personFields: 'names,emailAddresses'})
        .set('Authorization', `Bearer ${token}`);
    })
      
    // STEP 3: Retrieve user from database
    .then((response) => {

      const userData = {
        userName: response.body.names[0].displayName,
        email: response.body.emailAddresses[0].value,
      };
      return userFromOauth(userData);
    })

    // STEP 4: Generate session token
    .then((user) => {
      request.user = user;
      return Users.generateToken(user, googleData.token);
    });
};

const userFromOauth = (userData) => {
  return prisma.user({email: userData.email})
    .then((user) => {
      if (!user) {
        return prisma.createUser(userData);
      }
      return user;
    });
};

module.exports = { authorize };
