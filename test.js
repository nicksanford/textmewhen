var MongoClient = require("mongodb").MongoClient

MongoClient.connect( "mongodb://localhost:27017/textmewhen", function(err, db) {
  if (err) {
    console.log(err);
  } else{
    db.collection("request_jobs" ).find({}).toArray(function(err, docs) {
      if (err) {
        console.log(err);
      }
      else {
        console.log(docs);
      }
    });
  }
});
