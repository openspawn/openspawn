"use strict";

var _path = _interopRequireDefault(require("path"));
var _fs = _interopRequireDefault(require("fs"));
var _index = require("../index");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const getFilePath = filename => {
  return _path.default.resolve(__dirname, `assets/${filename}`);
};
const removeTempFile = filename => {
  const filepath = getFilePath(filename);
  _fs.default.unlink(filepath, error => {
    if (error) {
      throw error;
    }
  });
};
describe('testing locking', () => {
  describe('lockFile', () => {
    test('file should be found to be locked', done => {
      (0, _index.lockFile)(getFilePath('package.json'), error => {
        expect(error).toBeNull();
        removeTempFile('package.json.lock');
        done();
      });
    });
    test('file should fail to be found to be locked', done => {
      (0, _index.lockFile)(getFilePath('package.fail.json'), error => {
        expect(error.message).toMatch(/ENOENT: no such file or directory, stat '(.*)package.fail.json'/);
        done();
      });
    });
  });
  describe('unlockFile', () => {
    test('file should to be found to be unLock', done => {
      (0, _index.unlockFile)(getFilePath('package.json.lock'), error => {
        expect(error).toBeNull();
        done();
      });
    });
  });
  describe('readFile', () => {
    test('read file with no options should to be found to be read it as string', done => {
      (0, _index.readFile)(getFilePath('package.json'), {}, (error, data) => {
        expect(error).toBeNull();
        done();
      });
    });
    test('read file with no options should to be found to be read it as object', done => {
      const options = {
        parse: true
      };
      (0, _index.readFile)(getFilePath('package.json'), options, (error, data) => {
        expect(error).toBeNull();
        done();
      });
    });
    test('read file with options (parse) should to be not found to be read it', done => {
      const options = {
        parse: true
      };
      (0, _index.readFile)(getFilePath('package.fail.json'), options, error => {
        expect(error.message).toMatch(/ENOENT: no such file or directory, open '(.*)package.fail.json'/);
        done();
      });
    });
    test('read file with options should to be found to be read it and fails to be parsed', done => {
      const options = {
        parse: true
      };
      const errorMessage = process.platform === 'win32' ? 'Unexpected token } in JSON at position 47' : 'Unexpected token } in JSON at position 44';
      (0, _index.readFile)(getFilePath('wrong.package.json'), options, error => {
        expect(error.message).toEqual(errorMessage);
        done();
      });
    });
    test('read file with  options (parse, lock) should to be found to be read it as object', done => {
      const options = {
        parse: true,
        lock: true
      };
      (0, _index.readFile)(getFilePath('package2.json'), options, (error, data) => {
        expect(error).toBeNull();
        removeTempFile('package2.json.lock');
        done();
      });
    });
    test('read file with options (parse, lock) should to be found to be read it and fails to be parsed', done => {
      const options = {
        parse: true,
        lock: true
      };
      const errorMessage = process.platform === 'win32' ? 'Unexpected token } in JSON at position 47' : 'Unexpected token } in JSON at position 44';
      (0, _index.readFile)(getFilePath('wrong.package.json'), options, error => {
        expect(error.message).toEqual(errorMessage);
        removeTempFile('wrong.package.json.lock');
        done();
      });
    });
  });
});
//# sourceMappingURL=lock.spec.js.map