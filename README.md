TEXT ME WHEN
============

NEEDED FOR GETTING IT UP ON GITHUB
----------------------------------

BUSINESS LOGIC / NEW FEATURES
-----------------------------
  * Maybe I should notify the user if the price will never be low enough (look deeper
      into how surge pricing works)
  * Replace the email system with a texting system

UI
--
  * How will I do the UI?
  * All I need from the UI is the json object that I send to the backend
  * (Android + iOS) + WebApp

OPS
---
  * Bundle this bastard in Docker
  * Learn more about systemd

DATASTORE
--------
  * NOTE: Your app is going to be killed often so you should be able to deal with
      the app dying at any point and not interupt the user experience
  * There should be some kind of datastore (in ad different container) that will
      keep track of active jobs, completed jobs, and failed jobs.
  * What are you going to store (mongo &&|| redis)?

WEBSERVER / LOADBALANCER
-----------------------
  * This must be deployed with SSL and a load balancer (probably nginx unless there
      is a good reason not to use it as both the reverse proxy and load balancer)
  * Why would I not just use nginx as both the reverse proxy and load balancer?
  * Q: How would this scale? Maybe look up HAProxy?
  * A: It looks like the Uber will limit the # of requests I can do before
      node even gets the chance to get overloaded.

JSON objects + urls of interest
-------------------------------
  ```javascript
    url = "https://api.uber.com/v1/estimates/price";

    uber_parameters = { "server_token": "cF68ys0b2s7wBN_hBCftOdTe6SlkQs6jqggth0Z7", "start_latitude": "30.26463", "start_longitude": "-97.74403", "end_latitude": "30.31944", "end_longitude": "-97.71897"};

    textmewhen_api_parameters = {"start_lat":"30.26463","start_lon":"-97.74403","end_lat":"30.31944","end_lon":"-97.71897","end_time":"2014-12-14T18:37:55.347Z","email":"someguy@gmail.com","price":"15.00"}
  ```
