'use strict';

let constants = require('../constants.js');
let helper = require('../helper.js');
let config = helper.getConfig();
let log = require('bunyan').createLogger(config.loggerOptions);

let mandrill = require('mandrill-api/mandrill');
let mandrillClient = new mandrill.Mandrill(config.email.apiKey);

let util = require('util');


function emailNotification(email, next) {

    let to = [];

    email.recipients.forEach(function(item) {
        to.push({ "email": item, "type": "to" });
    });

    // Check out https://mandrillapp.com/api/docs/messages.nodejs.html#method-send for more details
    var message = {
        //"html": "<p>Example HTML content</p>",
        "text": email.body,
        "subject": email.subject,
        "from_email": config.email.fromEmail,
        "from_name": config.email.fromName,
        "to": to,
        "headers": {
            "Reply-To": config.email.replyTo
        },
        "important": false
    };

    var async = false;
    var ip_pool = "Main Pool";
    var send_at = null;

    if (process.env.MALACHITE_ENV !== 'unittest') {
        mandrillClient.messages.send({"message": message, "async": async, "ip_pool": ip_pool, "send_at": send_at}, function(result) {
            log.debug(`Email with subject "${email.subject}" sent to ${email.recipients}`);
            next();
        }, function(e) {
            // Mandrill returns the error as an object with name and message keys
            console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
            next(new Error(e.message));
        });
    } else {
        console.log(JSON.stringify(message));
        next();
    }
}

function feedback(feedback, next) {

    let theBody =
`Dear Bookmarkly peeps,

${feedback.screenName} (${feedback.username}) submitted the following feedback on ${helper.currentDatestamp()}
via the Bookmarkly website while on the following page:

${feedback.location}

---

${feedback.message}
`;

    let email = {
        recipients: config.feedback.to,
        subject: config.feedback.subjectPreamble + feedback.subject,
        body: theBody
    };

    emailNotification(email, function(err) {
        next(err);
    });

}

module.exports = {
    emailNotification: emailNotification,
    feedback: feedback
};
