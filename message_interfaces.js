var logging = require('node-logging');
var config = require("./config");
var nodemailer = require('nodemailer');
var objectMerge = require('object-merge');
// mongo

var transporter = nodemailer.createTransport({
    service: config.emailService,
    auth: {
        user: config.emailUser,
        pass: config.emailPass
    }
});

var setUpMailOptions = function (data) {
  return {
      from: 'Badass App ✔ <' + config.emailUser + '>', // sender address
      to: data.email, // list of receivers
      subject: 'Here is your info ✔', // Subject line
      text: data.msg(), // plaintext body
      html: '<b>' + data.msg() + ' ✔</b>' // html body
  }
};

var mailCallback = function (data, callback) {
  return function (error, info) {
          if(error){
              var newData = objectMerge( data, { mail_state: "email_error" } );
              logging.err("mailCallback error: ", error);
              callback(null, newData );
              // update mongo that there was an error sending the message
          }
          else{
              var newData = objectMerge( data, { mail_state: "email_sent" } );
              logging.inf('Message sent: ' + info.response);
              callback(null, newData);
              // update mongo that the message was sent
          }
        };
};

var sendMessage = function ( data, cb ) {
        console.log("in send messgae")
        if (data.msg) {
          var mailOptions = setUpMailOptions( data );
          transporter.sendMail( mailOptions,  mailCallback( data, cb ) );
        }
        else {
          cb(null, data)
        }
}

module.exports = sendMessage;
