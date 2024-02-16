const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();
const request = require("request");
const axios = require('axios');
const appVersion = require("../package.json").version;
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa')

//#region DB Setup - Create connection to database - Uses .env file for credentials
var tappDb  = mysql.createPool({
  connectionLimit : 10,
  host       : process.env.DBHOST,
  user       : process.env.DBUSER,
  password   : process.env.DBPASS,
  database   : process.env.DBNAME
});

const port = process.env.PORT || 8080;
//#endregion
const app = express()
  .use(cors())
  .use(bodyParser.json())
  .use(express.json())

  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

  const client = jwksClient({
    jwksUri: 'https://localhost:9443/oauth2/jwks'  // replace with your jwksUri
  });
  
  function getKey(header, callback){
    client.getSigningKey(header.kid, function(err, key) {
      var signingKey = key.publicKey || key.rsaPublicKey;
      callback(null, signingKey);
    });
  }

  // Middleware for token verification
  function verifyToken(req, res, next) {
    // Check if authorization header is present
    if (!req.headers.authorization) {
      return res.status(403).send('Authorization header is missing');
    }
  
    const token = req.headers.authorization.split(' ')[1];
  
    jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
      if (err) {
        return res.sendStatus(401);
      } else {
        req.decoded = decoded;
        next();
      }
    });
  }
  

//#region Swagger setup
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Tapp API',
    description: 'API to manage water bowsers, support tickets and user accounts.',
    version: appVersion,
    contact: {
      email: "admin@tapp.dylanwarrell.com"
    }
  },
  host: 'http://localhost:8080',
  servers: [
    {
      url: "http://localhost:8080",
      description: "Development server"
    }
  ]
};

const swaggerOptions = {
  swaggerOptions: {
     oauth: {
        clientId: "jQmbznK8c9mg90UftWYzfOtUmuwa",
        clientSecret: process.env.WSO2_CLIENT_SECRET
     },
  },
};

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ['src/swaggerConfig/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));
//#endregion

  //#region Bowsers
  app.get('/bowsers', verifyToken, function (req, res, next) {
        tappDb.query(
          'SELECT bowserId, lat, lon, size, createdOn, lastTopUp, status, capacityPercentage FROM bowsers WHERE deletedState=0',
          (error, results) => {
            if (error) {
              console.log(error);
              res.status(500).json({status: 'error'});
            } else {
              res.status(200).json(results);
            }
          }
        );  
  });

  app.get('/bowsers/:id', verifyToken, function (req, res, next) {
    tappDb.query(
      'SELECT bowserId, lat, lon, size, createdOn, lastTopUp, status, capacityPercentage FROM bowsers WHERE bowserId=? AND deletedState=0',
      [req.params.id],
      (error, results) => {
        if (error) {
          console.log(error);
          res.status(500).json({status: 'error'});
        } else {
          res.status(200).json({status: 'ok'});
        }
      }
    );
  });

  app.post('/bowsers', verifyToken, (req, res, next) => {
    tappDb.query({
      sql: 'INSERT INTO bowsers (lat, lon, size, status, capacityPercentage) VALUES (?,?,?,?,?)',
      values: [req.body.lat, req.body.lon, req.body.size, req.body.status, req.body.capacity],},
      function (error) {
        if (error) {
          console.error(error);
          res.status(500).json({status: 'error'});
        } else {
          const sgMail = require('@sendgrid/mail')
          sgMail.setApiKey(process.env.SENDGRIDAPI)
          const msg = {
            to: 'd.warrell@outlook.com',
            from: { "email": "noreply@tapp.dylanwarrell.com", 
                    "name": "Tapp Notifications" 
                  },
            template_id: 'd-0cbe4dc6485b45c89a079bc281585bc0',
            dynamic_template_data: {
              lat: req.body.lat || 'Not Provided',
              lon: req.body.lon  || 'Not Provided',
              size: req.body.size  || 'Not Provided',
            },
            asm: {
              group_id: 21373,
            },
          }
          sgMail.sendMultiple(msg)
          res.status(200).json({status: 'ok'});
        }
      }
    );
  });

 // const checkBowserDeleteScopes = requiredScopes('delete:bowsers');

  app.delete('/bowsers/:id', verifyToken, function (req, res, next) {
    tappDb.query(
      'UPDATE bowsers SET deletedState=1 WHERE bowserId=?',
      [req.params.id],
      (error, results) => {
        if (error) {
          console.log(error);
          res.status(500).json({status: 'error'});
        } else {
          const sgMail = require('@sendgrid/mail')
          sgMail.setApiKey(process.env.SENDGRIDAPI)
          const msg = {
            to: ['d.warrell@outlook.com'],
            from: { "email": "noreply@tapp.dylanwarrell.com", 
                    "name": "Tapp Notifications" 
                  },
            template_id: 'd-34732a0e031b4eaea05f6f482c31b7d6',
            dynamic_template_data: {
              bowserId: req.params.id,
              lat: req.body.lat || 'Not Provided',
              lon: req.body.lon  || 'Not Provided',
              size: req.body.size  || 'Not Provided',
              status: req.body.status  || 'Not Provided',
              capacityPercentage: req.body.capacityPercentage  || 'Not Provided',
            },
            asm: {
              group_id: 21374,
            },
          }
          sgMail.sendMultiple(msg)
          res.status(200).json(results);
        }
      }
    );
  });

  app.put('/bowsers/:id', function (req, res, next) {
    tappDb.query({
      sql: 'UPDATE bowsers SET lat=?, lon=?, size=?, lastTopUp=?, status=?, capacityPercentage=? WHERE bowserId=?',
      values: [req.body.lat, req.body.lon, req.body.size, req.body.lastTopUp, req.body.status, req.body.capacityPercentage, req.params.id]},
      function (error) {
        if (error) {
          res.status(500).json({status: 'error'});
        } else {
          const sgMail = require('@sendgrid/mail')
          sgMail.setApiKey(process.env.SENDGRIDAPI)
          const msg = {
            to: ['d.warrell@outlook.com'],
            from: { "email": "noreply@tapp.dylanwarrell.com", 
                    "name": "Tapp Notifications" 
                  },
            template_id: 'd-2714ea99c189424abb590804a7347fc4',
            dynamic_template_data: {
              bowserId: req.params.id,
              lastTopUp: req.body.lastTopUp  || 'Not Provided',
              lat: req.body.lat || 'Not Provided',
              lon: req.body.lon  || 'Not Provided',
              size: req.body.size  || 'Not Provided',
              status: req.body.Status  || 'Not Provided',
              capacityPercentage: req.body.capacityPercentage  || 'Not Provided',
            },
            asm: {
              group_id: 21375,
            },
          }
          sgMail.sendMultiple(msg)
          res.status(200).json({status: 'ok'});
        }
      }
    );
  });
  //#endregion

  //#region Tickets

  // Get all tickets
  app.get('/tickets', verifyToken, function (req, res, next) {
    tappDb.query(
      'SELECT requestId, title, description, type, status, lat, lon, priority FROM tickets WHERE deletedState=0',
      (error, results) => {
        if (error) {
          console.log(error);
          res.status(500).json({status: 'error'});
        } else {
          res.status(200).json(results);
        }
      }
    );
  });

  // Get ticket by ID
  app.get('/tickets/:id', verifyToken, function (req, res, next) {
    tappDb.query(
      'SELECT requestId, title, description, type, status, lat, lon, priority FROM tickets WHERE requestId=? AND deletedState=0',
      [req.params.id],
      (error, results) => {
        if (error) {
          console.log(error);
          res.status(500).json({status: 'error'});
        } else {
          res.status(200).json(results);
        }
      }
    );
  });

  // Soft delete ticket by ID
  app.delete('/tickets/:id', verifyToken, function (req, res, next) {
    tappDb.query(
      'UPDATE tickets SET deletedState=1 WHERE requestId=?',
      [req.params.id],
      (error, results) => {
        if (error) {
          console.log(error);
          res.status(500).json({status: 'error'});
        } else {
          const sgMail = require('@sendgrid/mail')
          sgMail.setApiKey('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')
          const msg = {
            to: ['d.warrell@outlook.com'],
            from: { "email": "noreply@tapp.dylanwarrell.com", 
                    "name": "Tapp Notifications" 
                  },
            template_id: 'd-616d56481cb745cf83b0cf56a4e2e516',
            dynamic_template_data: {
              id: req.params.id,
              title: req.body.title  || 'Not Provided',
              description: req.body.description || 'Not Provided',
              type: req.body.type  || 'Not Provided',
              status: req.body.status  || 'Not Provided',
              priority: req.body.priority  || 'Not Provided',
              lat: req.body.lat  || 'Not Provided',
              lng: req.body.lng  || 'Not Provided',
            },
            asm: {
              group_id: 21403,
            },
          }
          sgMail.sendMultiple(msg)
          res.status(200).json(results);
        }
      }
    );
  });

  // Update ticket by ID
  app.put('/tickets/:id', verifyToken, function (req, res, next) {
    tappDb.query({
      sql: 'UPDATE tickets SET title=?, description=?, type=?, status=?, lat=?, lon=?, priority=? WHERE requestId=?',
      values: [req.body.title, req.body.description, req.body.type, req.body.status, req.body.lat, req.body.lon, req.body.priority, req.params.id]},
      function (error) {
        if (error) {
          res.status(500).json();
        } else {
          const sgMail = require('@sendgrid/mail')
          sgMail.setApiKey('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')
          const msg = {
            to: ['d.warrell@outlook.com'],
            from: { "email": "noreply@tapp.dylanwarrell.com", 
                    "name": "Tapp Notifications" 
                  },
            template_id: 'd-a22f593d082a4a94af402fca5dfb1fc4',
            dynamic_template_data: {
              id: req.params.id,
              title: req.body.title  || 'Not Provided',
              description: req.body.description || 'Not Provided',
              type: req.body.type  || 'Not Provided',
              status: req.body.status  || 'Not Provided',
              priority: req.body.priority  || 'Not Provided',
              lat: req.body.lat  || 'Not Provided',
              lng: req.body.lng  || 'Not Provided',
            },
            asm: {
              group_id: 21405,
            },
          }
          sgMail.sendMultiple(msg)
          res.status(200).json();
        }
      }
    );
  });

  // Create new ticket
  app.post('/tickets', verifyToken, (req, res, next) => {
    tappDb.query({
      sql: 'INSERT INTO tickets (title, description, type, status, lat, lon, priority) VALUES (?,?,?,?,?,?,?)',
      values: [req.body.title, req.body.description, req.body.type, req.body.status, req.body.lat, req.body.lng, req.body.priority],},
      function (error) {
        if (error) {
          console.error(error);
          res.status(500).json({status: 'error'});
        } else {
          const sgMail = require('@sendgrid/mail')
          sgMail.setApiKey('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')
          const msg = {
            to: ['d.warrell@outlook.com'],
            from: { "email": "noreply@tapp.dylanwarrell.com", 
                    "name": "Tapp Notifications" 
                  },
            template_id: 'd-996269fdef7c4b7b9ded677d15a91844',
            dynamic_template_data: {
              id: req.params.id,
              title: req.body.title  || 'Not Provided',
              description: req.body.description || 'Not Provided',
              type: req.body.type  || 'Not Provided',
              status: req.body.status  || 'Not Provided',
              priority: req.body.priority  || 'Not Provided',
              lat: req.body.lat  || 'Not Provided',
              lng: req.body.lng  || 'Not Provided',
            },
            asm: {
              group_id: 21404,
            },
          }
          sgMail.sendMultiple(msg)
          res.status(200).json({status: 'ok'});
        }
      }
    );
  });
  //#endregion

  //#region Stats
  app.get('/bowserticketstats', async function (req, res, next) {
    try {
      const bowsersCountPromise = getCount('SELECT COUNT(*) FROM bowsers WHERE deletedState=0');
      const activeBowsersCountPromise = getCount('SELECT COUNT(*) FROM bowsers WHERE status = "Active"');
      const pendingTicketCountPromise = getCount('SELECT COUNT(*) FROM tickets WHERE status = "Pending"');
      const activeTicketCountPromise = getCount('SELECT COUNT(*) FROM tickets WHERE status = "In Progress"');
      const bowserDownCountPromise = getCount('SELECT COUNT(*) FROM bowsers WHERE status IN ("Problematic", "Down", "Out of Service", "Maintenance", "Needs Attention")');
  
      const [bowsersCount, activeBowsersCount, pendingTicketCount, activeTicketCount, bowserDownCount] = await Promise.all([
        bowsersCountPromise,
        activeBowsersCountPromise,
        pendingTicketCountPromise,
        activeTicketCountPromise,
        bowserDownCountPromise
      ]);
  
      const mergedCounts = {
        bowsersCount,
        activeBowsersCount,
        pendingTicketCount,
        activeTicketCount,
        bowserDownCount
      };
  
      res.status(200).json(mergedCounts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error' });
    }
  });
  
  function getCount(query) {
    return new Promise((resolve, reject) => {
      tappDb.query(query, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results[0]['COUNT(*)']);
        }
      });
    });
  }
  
  app.get('/bowserscount', verifyToken, function (req, res, next) {
    tappDb.query(
      'SELECT COUNT(*) FROM bowsers WHERE deletedState=0',
      (error, results) => {
        if (error) {
          console.log(error);
          res.status(500).json({status: 'error'});
        } else {
          res.status(200).json(results);
        }
      }
    );
  });

  app.get('/activebowserscount', verifyToken, function (req, res, next) {
    tappDb.query(
      'SELECT COUNT(*) FROM bowsers WHERE status = "Active"',
      (error, results) => {
        if (error) {
          console.log(error);
          res.status(500).json({status: 'error'});
        } else {
          res.status(200).json(results);
        }
      }
    );
  });

  app.get('/pendingticketcount', verifyToken, function (req, res, next) {
    tappDb.query(
      'SELECT COUNT(*) FROM tickets WHERE status = "Pending"',
      (error, results) => {
        if (error) {
          console.log(error);
          res.status(500).json({status: 'error'});
        } else {
          res.status(200).json(results);
        }
      }
    );
  });

  app.get('/activeticketcount', verifyToken, function (req, res, next) {
    tappDb.query(
      'SELECT COUNT(*) FROM tickets WHERE status = "In Progress"',
      (error, results) => {
        if (error) {
          console.log(error);
          res.status(500).json({status: 'error'});
        } else {
          res.status(200).json(results);
        }
      }
    );
  });

  app.get('/bowserdowncount', verifyToken, function (req, res, next) {
    tappDb.query(
      'SELECT COUNT(*) FROM bowsers WHERE status = "Problematic" OR status = "Down" OR status = "Out of Service" OR status = "Maintenance" OR status = "Needs Attention"',
      (error, results) => {
        if (error) {
          console.log(error);
          res.status(500).json({status: 'error'});
        } else {
          res.status(200).json(results);
        }
      }
    );
  });

  //#endregion

// START APP
app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
  console.log(`UI available at http://localhost:${port}/swagger`);
});
