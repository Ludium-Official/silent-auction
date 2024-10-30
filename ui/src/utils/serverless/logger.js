import winston from "winston";
import Transport from "winston-transport";
import api from './api'

const { v4: uuidv4 } = require("uuid");
const { REACT_APP_DEBUG, REACT_APP_CHAIN_ID, REACT_APP_CONTRACT_ADDRESS } =
  process.env;

const { combine, timestamp, label, printf } = winston.format;

var meta = {
  id: uuidv4(),
  type: "frontend",
  startTime: Date.now(),
  chain: REACT_APP_CHAIN_ID,
  contract: REACT_APP_CONTRACT_ADDRESS,
};

const myFormat = printf(({ level, message, winstonModule, wf, timestamp }) => {
  return `${timestamp} ${level} [${winstonModule}:${wf}]: ${message}`;
});

class VirtuosoTransport extends Transport {
  constructor(opts) {
    super(opts);
  }

  log(info, callback) {
    setImmediate(() => {
      api.winston(info);
    });

    // Perform the writing to the remote service
    callback();
  }
}

const transportInfo = [new VirtuosoTransport({ level: "info" })];
const transportDebug = [new VirtuosoTransport({ level: "info" })];

if (REACT_APP_DEBUG === "true") {
  transportInfo.push(
    new winston.transports.Console({
      colorize: true,
      timestamp: true,
      level: "info",
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "HH:mm:ss.SSS" }),
        myFormat
      ),
    })
  );
  transportDebug.push(
    new winston.transports.Console({
      colorize: true,
      timestamp: true,
      level: "debug",
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "HH:mm:ss.SSS" }),
        myFormat
      ),
    })
  );
}

const info = new winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: transportInfo,
  defaultMeta: { winstonFrontendMeta: meta },
  exceptionHandlers: transportInfo,
  rejectionHandlers: transportInfo,
  exitOnError: false,
});

const debug = new winston.createLogger({
  level: "debug",
  format: winston.format.json(),
  transports: transportDebug,
  defaultMeta: { winstonFrontendMeta: meta },
  exceptionHandlers: transportDebug,
  rejectionHandlers: transportDebug,
  exitOnError: false,
});

export default {
  info: info,
  debug: debug,
  meta: meta,
};
