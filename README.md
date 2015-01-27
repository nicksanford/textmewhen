TEXT ME WHEN
============

This is an API / Webapp that notifies you when your uber ride from A to B is
the price you want to pay for it via email or text (still to be implemented).

In the notification is a link to get your uber ride.

STARTUP
-----
Run ```npm install``` before anything else.

Start the API up with ```node main```

Mocha tests are in the tests directory and can be run with ```mocha``` if you have 
it installed globaly or ```node_modules/mocha/bin/mocha``` if you don't.

create a config.js like so
```
var config = {
  uberServerToken: "YOUR UBER SERVER TOKEN",
  uberClientId: "YOUR UBER CLIENT ID",
  milliSecsBetweenAsyncSpawns: NUMBER OF SECONDS YOU WANT THE API TO WAIT BEFORE PINGING UBER AGAIN,
  collectionName: "NAME OF YOUR MONGODB COLLECTION",
  databaseUrl: "MONGO DB DATABASE URL",
  emailService: "THIS SHOULD PROBABLY BE 'gmail'",
  emailUser: "YOURUSERNAME@gmail.com",
  emailPass: "GMAILYOURPASSWORD",
  port: THE PORT YOU WANT THE API SERVER TO RUN ON,
  timoutMinutes: THE NUMBER OF MINUTES YOU WANT IT TO TAKE BEFORE A REQUEST EXPIRES
};

module.exports = config;

```

BUSINESS LOGIC / UPCOMING FEATURES
-----------------------------
  * Maybe I should notify the user if the price will never be low enough (look deeper
      into how surge pricing works)
  * Add optional texting notification system
  * Currently the app keeps track of the job state:
    ```
    ["started", "request_error", "success", "timeout", "uber_api_limit_error"]
    ```
    and the mail state:
    ```
    ["email_error", "email_sent" ]
    ```
  * When the server starts up it should restart all jobs that have a state
    of request_error, uber_api_limit_error started and/or an email_state of
    email_error.  This is because these jobs have failed for whatever reason and
    then need to be restarted.

DATASTORE
--------
  * The API uses MongoDB as the datastore and mongoose as the ORM

FRONTEND
--------
  * The API doesn't care about the frontend (like a good API).
  * Currently the frontend is implemented in Backbone but iOS / Android apps may be comming soon
  * The Backbone app is able to make a request to the API at the moment but needs 
    frontend validations + modal notification that the request has been (sent, failed, whatever)
  * At the moment, node doesn't serve up the Backbone frontend, rather NGINX forwards 
    GET requests to index.html and POST requests to the node API

OPS
---
  * Bundle this bastard in Docker
  * Learn more about systemd

JSON objects + urls of interest
-------------------------------
  ```javascript
    uber_api_url = "https://api.uber.com/v1/estimates/price";
    testmewhen_api_url = "https://textmewhen.com/api/v1/uber";

    uber_parameters = { "server_token": "SOMESERVERTOKEN", "start_latitude": "30.26463", "start_longitude": "-97.74403", "end_latitude": "30.31944", "end_longitude": "-97.71897"};

    textmewhen_api_parameters = {"start_latitude":"30.26463","start_longitude":"-97.74403","end_latitude":"30.31944","end_longitude":"-97.71897","email":"someguy@gmail.com","desired_price":"15.00"}
  ```
