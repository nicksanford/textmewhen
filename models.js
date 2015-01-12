var MongoClient = require("mongodb").MongoClient
var logging = require('node-logging');
var config = require("./config");

var createPostRequest = function (db, data, cb) {
  var pr = db.collection( config.collectionName );
  pr.insert(data, function (err, result) {
    if (err) {
      cb(err);
    }
    else {
      cb(null, result);
    }
  });
};

var updatePostRequest = function (db, data, cb) {
  var pr = db.collection( config.collectionName );
  pr.update( { _id: data._id }, { $set: { state: data.state, mail_state: data.mail_state, low_price: data.low_price, map_link: data.map_link } }, function (err, result) {
    if (err) {
      cb(err);
    }
    else {
      cb(null, result);
    }
});
};

var processCallbackString = function (cbs, data, db, callback) {
  switch (cbs) {
    case "create":
      createPostRequest(db, data, function (err, res) {
        if (err) {
          callback(err);
        }
        else {
         callback(null, res.ops[0]);
        }
        db.close();
      } );
      break;
    case "update":
      updatePostRequest(db, data, function (err, res) {
        if (err) {
          callback(err);
        }
        else {
         callback(null, res);
        }
        db.close();
      } );
      break;
    default:
      callback("clientWrapper was passed a callbackString that doesn't exist");
      db.close();
  }
};

var dbWrapper = function (callbackString, data, callback) {
  MongoClient.connect(config.databaseUrl, function (err, db) {
    if (err) {
      logging.err(err);
    }
    else {
      processCallbackString( callbackString, data, db, callback);
    }
  });
};

module.exports = dbWrapper;
