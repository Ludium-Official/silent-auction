const winston = require("winston"),
  WinstonCloudWatch = require("winston-cloudwatch");
const { format } = require("logform");
const { v4: uuidv4 } = require("uuid");

const { combine, timestamp, label, printf } = winston.format;

const {
  WINSTON_ID,
  WINSTON_KEY,
  WINSTON_NAME,
  WINSTON_REGION,
  WINSTON_CHAIN_ID,
} = process.env;

var meta = {
  id: uuidv4(),
  type: "functions",
  startTime: Date.now(),
  startFormattedTime: new Date().toISOString().replace(/T/, " "),
  updated: true,
};

function initMeta() {
  meta = {
    id: uuidv4(),
    type: "functions",
    startTime: Date.now(),
    startFormattedTime: new Date().toISOString().replace(/T/, " "),
  };
}

const myFormat = printf(({ level, message, winstonModule, wf, timestamp }) => {
  return `${timestamp} ${level} [${winstonModule} ${
    wf === undefined ? "" : ":" + wf
  }]: ${message}`;
});

function formatWinstonTime(ms) {
  if (ms === undefined) return "";
  if (ms < 1000) return ms + " ms";
  if (ms < 60 * 1000) return parseInt(ms / 1000) + " sec";
  if (ms < 60 * 60 * 1000) return parseInt(ms / 1000 / 60) + " min";
  return parseInt(ms / 1000 / 60 / 60) + " h";
}

const winstonFormat = format((info, opts) => {
  const wTimer = Date.now() - meta.startTime;
  info.winstonTimer = wTimer;
  info.winstonTimerText = formatWinstonTime(wTimer);

  return info;
});

const cloudwatchConfig = {
  level: "info",
  logGroupName: WINSTON_NAME,
  logStreamName: WINSTON_CHAIN_ID,
  awsOptions: {
    credentials: {
      accessKeyId: WINSTON_ID,
      secretAccessKey: WINSTON_KEY,
    },
    region: WINSTON_REGION,
  },
  jsonMessage: true,
  //messageFormatter: ({ level, message, additionalInfo }) =>    `[${level}] : ${message} \nAdditional Info: ${JSON.stringify(additionalInfo)}}`
};

const transportInfo = [
  new winston.transports.Console({
    colorize: true,
    timestamp: true,
    level: "info",
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: "HH:mm:ss.SSS" }),
      myFormat
    ),
  }),
  new WinstonCloudWatch(cloudwatchConfig),
];

const transportDebug = [
  new winston.transports.Console({
    colorize: true,
    timestamp: true,
    level: "debug",
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: "HH:mm:ss.SSS" }),
      myFormat
    ),
  }),
  new WinstonCloudWatch(cloudwatchConfig),
];

const debug = new winston.createLogger({
  level: "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winstonFormat()
  ),
  defaultMeta: {
    winstonChainId: WINSTON_CHAIN_ID,
    winstonLevel: "debug",
    winstonRepo: "functions",
    winstonFunctionsMeta: meta,
  },
  transports: transportDebug,
  exceptionHandlers: transportDebug,
  rejectionHandlers: transportDebug,
});

const info = new winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winstonFormat()
  ),
  defaultMeta: {
    winstonChainId: WINSTON_CHAIN_ID,
    winstonLevel: "info",
    winstonRepo: "functions",
    winstonFunctionsMeta: meta,
  },
  transports: transportInfo,
  exceptionHandlers: transportInfo,
  rejectionHandlers: transportInfo,
});

async function flush() {
  await new Promise((resolve) => {
    transportInfo[1].kthxbye(resolve);
  });
  await new Promise((resolve) => {
    transportDebug[1].kthxbye(resolve);
  });
}

module.exports = { info, debug, flush, meta, initMeta };
