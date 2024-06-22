const EventEmitter = require('events');
class EmailEmitter extends EventEmitter {}
const emailEmitter = new EmailEmitter();
module.exports = emailEmitter;