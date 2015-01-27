TEXT ME WHEN
============

BUSINESS LOGIC / UPCOMING FEATURES
-----------------------------
  * Maybe I should notify the user if the price will never be low enough (look deeper
      into how surge pricing works)
  * Add optional texting notification system
  * Currently the app keeps track of the job state:
    ```javascript
    ["started", "request_error", "success", "timeout", "uber_api_limit_error"]
    ```
    and the mail state:
    ```javascript
    ["email_error", "email_sent" ]
    ```
  * When the server starts up it should restart all jobs that have a state
    of request_error, uber_api_limit_error started and/or an email_state of
    email_error.  This is because these jobs have failed for whatever reason and
    then need to be resent.

DATASTORE
--------
  * The API uses MongoDB as the datastore and mongoose as the ORM

FRONTEND
--------
  * The API doesn't care about the frontend (like a good API).
  * Currently the frontend is implemented in Backbone but iOS / Android apps may be comming soon
  * The Backbone app is able to make a request to the API at the moment but needs 
    frontend validations + modal notification that the request has been (sent, failed, whatever)

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
