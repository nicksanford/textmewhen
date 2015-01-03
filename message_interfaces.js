var logging = require('node-logging');
var config = require("./config");
var nodemailer = require('nodemailer');
// mongo

var transporter = nodemailer.createTransport({
    service: config.emailService,
    auth: {
        user: config.emailUser,
        pass: config.emailPass
    }
});

var setUpMailOptions = function (email, message) {
  return {
      from: 'Badass App ✔ <' + config.emailUser + '>', // sender address
      to: email, // list of receivers
      subject: 'Here is your info ✔', // Subject line
      text: message, // plaintext body
      html: '<b>' + message + ' ✔</b>' // html body
  }
};

var mailCallback = function (error, info) {
          if(error){
              logging.err("mailCallback error: ", error);
              // update mongo that there was an error sending the message
          }
          else{
              logging.inf('Message sent: ' + info.response);
              // update mongo that the message was sent
          }
};

var ETHEL_ADDED;

var sendMessage = function ( contactInfo, message ) {
        var mailOptions = setUpMailOptions( contactInfo , message );
        transporter.sendMail( mailOptions, mailCallback );
}
module.exports = sendMessage;
