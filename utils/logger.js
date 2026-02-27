// Imports the Winston logging library.
const winston = require('winston');     

// creating a logging tool and setting it up with specific options
// 'level: info' sets the minimum severity the logger will record, which include: error, warn, and info
// 'combine()' lets you stack multiple formatting operations together.
// '.timestamp' automatically adds a timestamp property to every log entry
// Destructures the Winston log info object to extract timestamp, level, and message
// return statement builds the final log string using template literals.
// Write log messages with severity level error (or higher) to the file named error.log
const logger = winston.createLogger({
  level: 'info',                                                    
  format: winston.format.combine(                        
    winston.format.timestamp(),                         
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`
    })
  ),
  
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console()
  ]
});

module.exports = logger;


  
//Log levels (from most severe to least): error, warn, info, http, verbose, debug, and silly
// Winston Log Levels (Highest Priority to Lowest):
/*
error(0) → Something broke.
warn(1) → Something unexpected happened.
info(2) → Normal important events.
http(3) → Request-level events.
verbose(4) → More detailed internal activity.
debug(5) → Developer-focused troubleshooting.
silly(6) → Extremely granular tracing.
*/

// Lower number = higher severity.