import { userInfo } from 'os';

/** this module (.js) run as entry point `process.argv[1]` */
if (require.main === module) {
  main();
}

/** `main` function as application entry point */
async function main() {
  /** listen `unhandledRejection` and `throw` it into sync `Error` */
  process.on('unhandledRejection', err => {
    console.error('Unhandled Rejection at:', err);
  });

  /**
   * define a `Error.prototype.toJSON` to stringify the Error object
   * @see https://stackoverflow.com/questions/18391212/is-it-not-possible-to-stringify-an-error-using-json-stringify
   */
  if (!('toJSON' in Error.prototype)) {
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(Error.prototype, 'toJSON', {
      value: function toJSON() {
        const alt: Record<string, unknown> = {};
        Object.getOwnPropertyNames(this).forEach(key => {
          alt[key] = this[key];
        });
        return alt;
      },
      configurable: true,
      writable: true,
    });
  }

  console.log('System information', {
    'process.pid': process.pid,
    'process.ppid': process.ppid,
    'process.platform': process.platform,
    'process.arch': process.arch,
    'process.versions': process.versions,
    'os.userInfo()': userInfo(),
  });
}
