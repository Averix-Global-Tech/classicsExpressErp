/**
 * Tiny logger wrapper. Keeps timestamps + level prefixes consistent and avoids
 * pulling a heavier dependency. Swap internals for winston/pino later if needed.
 */
const config = require('../config/env');

const ts = () => new Date().toISOString();

function format(level, args) {
  const [head, ...rest] = args;
  return [`${ts()} [${level.toUpperCase()}] ${typeof head === 'string' ? head : ''}`]
    .concat(rest)
    .filter((_, i, arr) => !(i === 0 && arr[0] === '' && rest.length === 0));
}

const logger = {
  info: (...args) => console.info(...format('info', args)),
  warn: (...args) => console.warn(...format('warn', args)),
  error: (...args) => console.error(...format('error', args)),
  debug: (...args) => {
    if (config.isDev) console.debug(...format('debug', args));
  },
};

module.exports = logger;
