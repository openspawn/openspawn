"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addVersion = addVersion;
exports.default = publish;
exports.publishPackage = publishPackage;
exports.removeTarball = removeTarball;
exports.unPublishPackage = unPublishPackage;
exports.uploadPackageTarball = uploadPackageTarball;
var _debug = _interopRequireDefault(require("debug"));
var _lodash = _interopRequireDefault(require("lodash"));
var _mime = _interopRequireDefault(require("mime"));
var _path = _interopRequireDefault(require("path"));
var _core = require("@verdaccio/core");
var _hooks = require("@verdaccio/hooks");
var _middleware = require("@verdaccio/middleware");
var _constants = require("../../../lib/constants");
var _logger = require("../../../lib/logger");
var _storageUtils = require("../../../lib/storage-utils");
var _utils = require("../../../lib/utils");
var _star = _interopRequireDefault(require("./star"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:publish');
function publish(router, auth, storage, config) {
  const can = (0, _middleware.allow)(auth, {
    beforeAll: (params, message) => _logger.logger.trace(params, message),
    afterAll: (params, message) => _logger.logger.trace(params, message)
  });

  /**
   * Publish a package / update package / un/start a package
   *
   * There are multiples scenarios here to be considered:
   *
   * 1. Publish scenario
   *
   * Publish a package consist of at least 1 step (PUT) with a metadata payload.
   * When a package is published, an _attachment property is present that contains the data
   * of the tarball.
   *
   * Example flow of publish.
   *
   *  npm http fetch PUT 201 http://localhost:4873/@scope%2ftest1 9627ms
      npm info lifecycle @scope/test1@1.0.1~publish: @scope/test1@1.0.1
      npm info lifecycle @scope/test1@1.0.1~postpublish: @scope/test1@1.0.1
      + @scope/test1@1.0.1
      npm verb exit [ 0, true ]
   *
   *
   * 2. Unpublish scenario
   *
   * Unpublish consist in 3 steps.
   *  1. Try to fetch  metadata -> if it fails, return 404
   *  2. Compute metadata locally (client side) and send a mutate payload excluding the version to be unpublished
   *    eg: if metadata reflects 1.0.1, 1.0.2 and 1.0.3, the computed metadata won't include 1.0.3.
   *  3. Once the second step has been successfully finished, delete the tarball.
   *
   *  All these steps are consecutive and required, there is no transacions here, if step 3 fails, metadata might
   *  get corrupted.
   *
   *  Note the unpublish call will suffix in the url a /-rev/14-5d500cfce92f90fd revision number, this not
   *  used internally.
   *
   *
   * Example flow of unpublish.
   *
   * npm http fetch GET 200 http://localhost:4873/@scope%2ftest1?write=true 1680ms
     npm http fetch PUT 201 http://localhost:4873/@scope%2ftest1/-rev/14-5d500cfce92f90fd 956606ms attempt #2
     npm http fetch GET 200 http://localhost:4873/@scope%2ftest1?write=true 1601ms
     npm http fetch DELETE 201 http://localhost:4873/@scope%2ftest1/-/test1-1.0.3.tgz/-rev/16-e11c8db282b2d992 19ms
   *
   * 3. Star a package
   *
   * Permissions: start a package depends of the publish and unpublish permissions, there is no specific flag for star or un start.
   * The URL for star is similar to the unpublish (change package format)
   *
   * npm has no enpoint for star a package, rather mutate the metadata and acts as, the difference is the
   * users property which is part of the payload and the body only includes
   *
   * {
    "_id": pkgName,
   	"_rev": "3-b0cdaefc9bdb77c8",
    "users": {
      [username]: boolean value (true, false)
    }
  }
   *
   */
  router.put('/:package/:_rev?/:revision?', can('publish'), (0, _middleware.media)(_mime.default.getType('json')), _middleware.expectJson, publishPackage(storage, config, auth));

  /**
   * Un-publishing an entire package.
   *
   * This scenario happens when the first call detect there is only one version remaining
   * in the metadata, then the client decides to DELETE the resource
   * npm http fetch GET 304 http://localhost:4873/@scope%2ftest1?write=true 1076ms (from cache)
     npm http fetch DELETE 201 http://localhost:4873/@scope%2ftest1/-rev/18-d8ebe3020bd4ac9c 22ms
   */
  router.delete('/:package/-rev/*', can('unpublish'), unPublishPackage(storage));

  // removing a tarball
  router.delete('/:package/-/:filename/-rev/:revision', can('unpublish'), can('publish'), removeTarball(storage));

  // uploading package tarball
  router.put('/:package/-/:filename/*', can('publish'), (0, _middleware.media)(_constants.HEADERS.OCTET_STREAM), uploadPackageTarball(storage));

  // only used for development
  if (config._debug) {
    // adding a version
    router.put('/:package/:version/-tag/:tag', can('publish'), (0, _middleware.media)(_mime.default.getType('json')), _middleware.expectJson, addVersion(storage));
  }
}

/**
 * Publish a package
 */
function publishPackage(storage, config, auth) {
  const starApi = (0, _star.default)(storage);
  return function (req, res, next) {
    const packageName = req.params.package;
    debug('publishing or updating a new version for %o', packageName);
    /**
     * Write tarball of stream data from package clients.
     */
    const createTarball = function (filename, data, cb) {
      const stream = storage.addTarball(packageName, filename);
      stream.on('error', function (err) {
        cb(err);
      });
      stream.on('success', function () {
        cb();
      });
      // this is dumb and memory-consuming, but what choices do we have?
      // flow: we need first refactor this file before decides which type use here
      stream.end(Buffer.from(data.data, 'base64'));
      stream.done();
    };

    /**
     * Add new package version in storage
     */
    const createVersion = function (version, metadata, cb) {
      storage.addVersion(packageName, version, metadata, null, cb);
    };

    /**
     * Add new tags in storage
     */
    const addTags = function (tags, cb) {
      storage.mergeTags(packageName, tags, cb);
    };
    const afterChange = function (error, okMessage, metadata) {
      const metadataCopy = {
        ...metadata
      };
      const {
        _attachments,
        versions
      } = metadataCopy;

      // `npm star` wouldn't have attachments
      // and `npm deprecate` would have attachments as a empty object, i.e {}
      if (_lodash.default.isNil(_attachments) || JSON.stringify(_attachments) === '{}') {
        if (error) {
          return next(error);
        }
        res.status(_constants.HTTP_STATUS.CREATED);
        return next({
          ok: okMessage,
          success: true
        });
      }

      // npm-registry-client 0.3+ embeds tarball into the json upload
      // https://github.com/isaacs/npm-registry-client/commit/e9fbeb8b67f249394f735c74ef11fe4720d46ca0
      // issue https://github.com/rlidwka/sinopia/issues/31, dealing with it here:
      const isInvalidBodyFormat = (0, _utils.isObject)(_attachments) === false || (0, _utils.hasDiffOneKey)(_attachments) || (0, _utils.isObject)(versions) === false || (0, _utils.hasDiffOneKey)(versions);
      if (isInvalidBodyFormat) {
        // npm is doing something strange again
        // if this happens in normal circumstances, report it as a bug
        _logger.logger.info({
          packageName
        }, `wrong package format on publish a package @{packageName}`);
        return next(_utils.ErrorCode.getBadRequest(_constants.API_ERROR.UNSUPORTED_REGISTRY_CALL));
      }
      if (error && error.status !== _constants.HTTP_STATUS.CONFLICT) {
        return next(error);
      }

      // at this point document is either created or existed before
      const [firstAttachmentKey] = Object.keys(_attachments);
      createTarball(_path.default.basename(firstAttachmentKey), _attachments[firstAttachmentKey], function (error) {
        if (error) {
          return next(error);
        }
        const versionToPublish = Object.keys(versions)[0];
        const versionMetadataToPublish = versions[versionToPublish];
        versionMetadataToPublish.readme = _lodash.default.isNil(versionMetadataToPublish.readme) === false ? String(versionMetadataToPublish.readme) : '';
        createVersion(versionToPublish, versionMetadataToPublish, function (error) {
          if (error) {
            return next(error);
          }
          addTags(metadataCopy[_constants.DIST_TAGS], async function (error) {
            if (error) {
              return next(error);
            }
            try {
              await (0, _hooks.notify)(metadataCopy, config, req.remote_user, `${metadataCopy.name}@${versionToPublish}`);
            } catch (error) {
              _logger.logger.error({
                error
              }, 'notify batch service has failed: @{error}');
            }
            res.status(_constants.HTTP_STATUS.CREATED);
            return next({
              ok: okMessage,
              success: true
            });
          });
        });
      });
    };
    if ((0, _storageUtils.isPublishablePackage)(req.body) === false && (0, _utils.isObject)(req.body.users)) {
      return starApi(req, res, next);
    }
    try {
      const metadata = _core.validationUtils.normalizeMetadata(req.body, packageName);
      // check _attachments to distinguish publish and deprecate
      if (req.params._rev || (0, _utils.isRelatedToDeprecation)(req.body) && _lodash.default.isEmpty(req.body._attachments)) {
        debug('updating a new version for %o', packageName);
        // we check unpublish permissions, an update is basically remove versions
        const remote = req.remote_user;
        auth.allow_unpublish({
          packageName
        }, remote, error => {
          if (error) {
            _logger.logger.error({
              packageName
            }, `not allowed to unpublish a version for @{packageName}`);
            return next(error);
          }
          storage.changePackage(packageName, metadata, req.params.revision, function (error) {
            afterChange(error, _constants.API_MESSAGE.PKG_CHANGED, metadata);
          });
        });
      } else {
        debug('adding a new version for %o', packageName);
        storage.addPackage(packageName, metadata, function (error) {
          afterChange(error, _constants.API_MESSAGE.PKG_CREATED, metadata);
        });
      }
    } catch (error) {
      debug('error on publish: %s', error.message);
      _logger.logger.error({
        packageName
      }, 'error on publish, bad package data for @{packageName}');
      return next(_utils.ErrorCode.getBadData(_constants.API_ERROR.BAD_PACKAGE_DATA));
    }
  };
}

/**
 * un-publish a package
 */
function unPublishPackage(storage) {
  return function (req, res, next) {
    const packageName = req.params.package;
    debug('unpublishing %o', packageName);
    storage.removePackage(packageName, function (err) {
      if (err) {
        return next(err);
      }
      res.status(_constants.HTTP_STATUS.CREATED);
      return next({
        ok: _constants.API_MESSAGE.PKG_REMOVED
      });
    });
  };
}

/**
 * Delete tarball
 */
function removeTarball(storage) {
  return function (req, res, next) {
    const packageName = req.params.package;
    const {
      filename,
      revision
    } = req.params;
    debug('removing a tarball for %o-%o-%o', packageName, filename, revision);
    storage.removeTarball(packageName, filename, revision, function (err) {
      if (err) {
        return next(err);
      }
      res.status(_constants.HTTP_STATUS.CREATED);
      debug('success remove tarball for %o-%o-%o', packageName, filename, revision);
      return next({
        ok: _constants.API_MESSAGE.TARBALL_REMOVED
      });
    });
  };
}
/**
 * Adds a new version
 */
function addVersion(storage) {
  return function (req, res, next) {
    const {
      version,
      tag
    } = req.params;
    const packageName = req.params.package;
    storage.addVersion(packageName, version, req.body, tag, function (error) {
      if (error) {
        return next(error);
      }
      res.status(_constants.HTTP_STATUS.CREATED);
      return next({
        ok: _constants.API_MESSAGE.PKG_PUBLISHED
      });
    });
  };
}

/**
 * uploadPackageTarball
 */
function uploadPackageTarball(storage) {
  return function (req, res, next) {
    const packageName = req.params.package;
    const stream = storage.addTarball(packageName, req.params.filename);
    req.pipe(stream);

    // checking if end event came before closing
    let complete = false;
    req.on('end', function () {
      complete = true;
      stream.done();
    });
    req.on('close', function () {
      if (!complete) {
        stream.abort();
      }
    });
    stream.on('error', function (err) {
      return res.locals.report_error(err);
    });
    stream.on('success', function () {
      res.status(_constants.HTTP_STATUS.CREATED);
      return next({
        ok: _constants.API_MESSAGE.TARBALL_UPLOADED
      });
    });
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZGVidWciLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9sb2Rhc2giLCJfbWltZSIsIl9wYXRoIiwiX2NvcmUiLCJfaG9va3MiLCJfbWlkZGxld2FyZSIsIl9jb25zdGFudHMiLCJfbG9nZ2VyIiwiX3N0b3JhZ2VVdGlscyIsIl91dGlscyIsIl9zdGFyIiwiZSIsIl9fZXNNb2R1bGUiLCJkZWZhdWx0IiwiZGVidWciLCJidWlsZERlYnVnIiwicHVibGlzaCIsInJvdXRlciIsImF1dGgiLCJzdG9yYWdlIiwiY29uZmlnIiwiY2FuIiwiYWxsb3ciLCJiZWZvcmVBbGwiLCJwYXJhbXMiLCJtZXNzYWdlIiwibG9nZ2VyIiwidHJhY2UiLCJhZnRlckFsbCIsInB1dCIsIm1lZGlhIiwibWltZSIsImdldFR5cGUiLCJleHBlY3RKc29uIiwicHVibGlzaFBhY2thZ2UiLCJkZWxldGUiLCJ1blB1Ymxpc2hQYWNrYWdlIiwicmVtb3ZlVGFyYmFsbCIsIkhFQURFUlMiLCJPQ1RFVF9TVFJFQU0iLCJ1cGxvYWRQYWNrYWdlVGFyYmFsbCIsImFkZFZlcnNpb24iLCJzdGFyQXBpIiwic3RhciIsInJlcSIsInJlcyIsIm5leHQiLCJwYWNrYWdlTmFtZSIsInBhY2thZ2UiLCJjcmVhdGVUYXJiYWxsIiwiZmlsZW5hbWUiLCJkYXRhIiwiY2IiLCJzdHJlYW0iLCJhZGRUYXJiYWxsIiwib24iLCJlcnIiLCJlbmQiLCJCdWZmZXIiLCJmcm9tIiwiZG9uZSIsImNyZWF0ZVZlcnNpb24iLCJ2ZXJzaW9uIiwibWV0YWRhdGEiLCJhZGRUYWdzIiwidGFncyIsIm1lcmdlVGFncyIsImFmdGVyQ2hhbmdlIiwiZXJyb3IiLCJva01lc3NhZ2UiLCJtZXRhZGF0YUNvcHkiLCJfYXR0YWNobWVudHMiLCJ2ZXJzaW9ucyIsIl8iLCJpc05pbCIsIkpTT04iLCJzdHJpbmdpZnkiLCJzdGF0dXMiLCJIVFRQX1NUQVRVUyIsIkNSRUFURUQiLCJvayIsInN1Y2Nlc3MiLCJpc0ludmFsaWRCb2R5Rm9ybWF0IiwiaXNPYmplY3QiLCJoYXNEaWZmT25lS2V5IiwiaW5mbyIsIkVycm9yQ29kZSIsImdldEJhZFJlcXVlc3QiLCJBUElfRVJST1IiLCJVTlNVUE9SVEVEX1JFR0lTVFJZX0NBTEwiLCJDT05GTElDVCIsImZpcnN0QXR0YWNobWVudEtleSIsIk9iamVjdCIsImtleXMiLCJQYXRoIiwiYmFzZW5hbWUiLCJ2ZXJzaW9uVG9QdWJsaXNoIiwidmVyc2lvbk1ldGFkYXRhVG9QdWJsaXNoIiwicmVhZG1lIiwiU3RyaW5nIiwiRElTVF9UQUdTIiwibm90aWZ5IiwicmVtb3RlX3VzZXIiLCJuYW1lIiwiaXNQdWJsaXNoYWJsZVBhY2thZ2UiLCJib2R5IiwidXNlcnMiLCJ2YWxpZGF0aW9uVXRpbHMiLCJub3JtYWxpemVNZXRhZGF0YSIsIl9yZXYiLCJpc1JlbGF0ZWRUb0RlcHJlY2F0aW9uIiwiaXNFbXB0eSIsInJlbW90ZSIsImFsbG93X3VucHVibGlzaCIsImNoYW5nZVBhY2thZ2UiLCJyZXZpc2lvbiIsIkFQSV9NRVNTQUdFIiwiUEtHX0NIQU5HRUQiLCJhZGRQYWNrYWdlIiwiUEtHX0NSRUFURUQiLCJnZXRCYWREYXRhIiwiQkFEX1BBQ0tBR0VfREFUQSIsInJlbW92ZVBhY2thZ2UiLCJQS0dfUkVNT1ZFRCIsIlRBUkJBTExfUkVNT1ZFRCIsInRhZyIsIlBLR19QVUJMSVNIRUQiLCJwaXBlIiwiY29tcGxldGUiLCJhYm9ydCIsImxvY2FscyIsInJlcG9ydF9lcnJvciIsIlRBUkJBTExfVVBMT0FERUQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpL2VuZHBvaW50L2FwaS9wdWJsaXNoLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBidWlsZERlYnVnIGZyb20gJ2RlYnVnJztcbmltcG9ydCB7IFJvdXRlciB9IGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBtaW1lIGZyb20gJ21pbWUnO1xuaW1wb3J0IFBhdGggZnJvbSAncGF0aCc7XG5cbmltcG9ydCB7IHZhbGlkYXRpb25VdGlscyB9IGZyb20gJ0B2ZXJkYWNjaW8vY29yZSc7XG5pbXBvcnQgeyBub3RpZnkgfSBmcm9tICdAdmVyZGFjY2lvL2hvb2tzJztcbmltcG9ydCB7IGFsbG93LCBleHBlY3RKc29uLCBtZWRpYSB9IGZyb20gJ0B2ZXJkYWNjaW8vbWlkZGxld2FyZSc7XG5pbXBvcnQgeyBDYWxsYmFjaywgQ29uZmlnLCBNZXJnZVRhZ3MsIFBhY2thZ2UsIFZlcnNpb24gfSBmcm9tICdAdmVyZGFjY2lvL3R5cGVzJztcblxuaW1wb3J0IEF1dGggZnJvbSAnLi4vLi4vLi4vbGliL2F1dGgnO1xuaW1wb3J0IHsgQVBJX0VSUk9SLCBBUElfTUVTU0FHRSwgRElTVF9UQUdTLCBIRUFERVJTLCBIVFRQX1NUQVRVUyB9IGZyb20gJy4uLy4uLy4uL2xpYi9jb25zdGFudHMnO1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vLi4vLi4vbGliL2xvZ2dlcic7XG5pbXBvcnQgU3RvcmFnZSBmcm9tICcuLi8uLi8uLi9saWIvc3RvcmFnZSc7XG5pbXBvcnQgeyBpc1B1Ymxpc2hhYmxlUGFja2FnZSB9IGZyb20gJy4uLy4uLy4uL2xpYi9zdG9yYWdlLXV0aWxzJztcbmltcG9ydCB7IEVycm9yQ29kZSwgaGFzRGlmZk9uZUtleSwgaXNPYmplY3QsIGlzUmVsYXRlZFRvRGVwcmVjYXRpb24gfSBmcm9tICcuLi8uLi8uLi9saWIvdXRpbHMnO1xuaW1wb3J0IHsgJE5leHRGdW5jdGlvblZlciwgJFJlcXVlc3RFeHRlbmQsICRSZXNwb25zZUV4dGVuZCB9IGZyb20gJy4uLy4uLy4uL3R5cGVzJztcbmltcG9ydCBzdGFyIGZyb20gJy4vc3Rhcic7XG5cbmNvbnN0IGRlYnVnID0gYnVpbGREZWJ1ZygndmVyZGFjY2lvOnB1Ymxpc2gnKTtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcHVibGlzaChcbiAgcm91dGVyOiBSb3V0ZXIsXG4gIGF1dGg6IEF1dGgsXG4gIHN0b3JhZ2U6IFN0b3JhZ2UsXG4gIGNvbmZpZzogQ29uZmlnXG4pOiB2b2lkIHtcbiAgY29uc3QgY2FuID0gYWxsb3coYXV0aCwge1xuICAgIGJlZm9yZUFsbDogKHBhcmFtcywgbWVzc2FnZSkgPT4gbG9nZ2VyLnRyYWNlKHBhcmFtcywgbWVzc2FnZSksXG4gICAgYWZ0ZXJBbGw6IChwYXJhbXMsIG1lc3NhZ2UpID0+IGxvZ2dlci50cmFjZShwYXJhbXMsIG1lc3NhZ2UpLFxuICB9KTtcblxuICAvKipcbiAgICogUHVibGlzaCBhIHBhY2thZ2UgLyB1cGRhdGUgcGFja2FnZSAvIHVuL3N0YXJ0IGEgcGFja2FnZVxuICAgKlxuICAgKiBUaGVyZSBhcmUgbXVsdGlwbGVzIHNjZW5hcmlvcyBoZXJlIHRvIGJlIGNvbnNpZGVyZWQ6XG4gICAqXG4gICAqIDEuIFB1Ymxpc2ggc2NlbmFyaW9cbiAgICpcbiAgICogUHVibGlzaCBhIHBhY2thZ2UgY29uc2lzdCBvZiBhdCBsZWFzdCAxIHN0ZXAgKFBVVCkgd2l0aCBhIG1ldGFkYXRhIHBheWxvYWQuXG4gICAqIFdoZW4gYSBwYWNrYWdlIGlzIHB1Ymxpc2hlZCwgYW4gX2F0dGFjaG1lbnQgcHJvcGVydHkgaXMgcHJlc2VudCB0aGF0IGNvbnRhaW5zIHRoZSBkYXRhXG4gICAqIG9mIHRoZSB0YXJiYWxsLlxuICAgKlxuICAgKiBFeGFtcGxlIGZsb3cgb2YgcHVibGlzaC5cbiAgICpcbiAgICogIG5wbSBodHRwIGZldGNoIFBVVCAyMDEgaHR0cDovL2xvY2FsaG9zdDo0ODczL0BzY29wZSUyZnRlc3QxIDk2Mjdtc1xuICAgICAgbnBtIGluZm8gbGlmZWN5Y2xlIEBzY29wZS90ZXN0MUAxLjAuMX5wdWJsaXNoOiBAc2NvcGUvdGVzdDFAMS4wLjFcbiAgICAgIG5wbSBpbmZvIGxpZmVjeWNsZSBAc2NvcGUvdGVzdDFAMS4wLjF+cG9zdHB1Ymxpc2g6IEBzY29wZS90ZXN0MUAxLjAuMVxuICAgICAgKyBAc2NvcGUvdGVzdDFAMS4wLjFcbiAgICAgIG5wbSB2ZXJiIGV4aXQgWyAwLCB0cnVlIF1cbiAgICpcbiAgICpcbiAgICogMi4gVW5wdWJsaXNoIHNjZW5hcmlvXG4gICAqXG4gICAqIFVucHVibGlzaCBjb25zaXN0IGluIDMgc3RlcHMuXG4gICAqICAxLiBUcnkgdG8gZmV0Y2ggIG1ldGFkYXRhIC0+IGlmIGl0IGZhaWxzLCByZXR1cm4gNDA0XG4gICAqICAyLiBDb21wdXRlIG1ldGFkYXRhIGxvY2FsbHkgKGNsaWVudCBzaWRlKSBhbmQgc2VuZCBhIG11dGF0ZSBwYXlsb2FkIGV4Y2x1ZGluZyB0aGUgdmVyc2lvbiB0byBiZSB1bnB1Ymxpc2hlZFxuICAgKiAgICBlZzogaWYgbWV0YWRhdGEgcmVmbGVjdHMgMS4wLjEsIDEuMC4yIGFuZCAxLjAuMywgdGhlIGNvbXB1dGVkIG1ldGFkYXRhIHdvbid0IGluY2x1ZGUgMS4wLjMuXG4gICAqICAzLiBPbmNlIHRoZSBzZWNvbmQgc3RlcCBoYXMgYmVlbiBzdWNjZXNzZnVsbHkgZmluaXNoZWQsIGRlbGV0ZSB0aGUgdGFyYmFsbC5cbiAgICpcbiAgICogIEFsbCB0aGVzZSBzdGVwcyBhcmUgY29uc2VjdXRpdmUgYW5kIHJlcXVpcmVkLCB0aGVyZSBpcyBubyB0cmFuc2FjaW9ucyBoZXJlLCBpZiBzdGVwIDMgZmFpbHMsIG1ldGFkYXRhIG1pZ2h0XG4gICAqICBnZXQgY29ycnVwdGVkLlxuICAgKlxuICAgKiAgTm90ZSB0aGUgdW5wdWJsaXNoIGNhbGwgd2lsbCBzdWZmaXggaW4gdGhlIHVybCBhIC8tcmV2LzE0LTVkNTAwY2ZjZTkyZjkwZmQgcmV2aXNpb24gbnVtYmVyLCB0aGlzIG5vdFxuICAgKiAgdXNlZCBpbnRlcm5hbGx5LlxuICAgKlxuICAgKlxuICAgKiBFeGFtcGxlIGZsb3cgb2YgdW5wdWJsaXNoLlxuICAgKlxuICAgKiBucG0gaHR0cCBmZXRjaCBHRVQgMjAwIGh0dHA6Ly9sb2NhbGhvc3Q6NDg3My9Ac2NvcGUlMmZ0ZXN0MT93cml0ZT10cnVlIDE2ODBtc1xuICAgICBucG0gaHR0cCBmZXRjaCBQVVQgMjAxIGh0dHA6Ly9sb2NhbGhvc3Q6NDg3My9Ac2NvcGUlMmZ0ZXN0MS8tcmV2LzE0LTVkNTAwY2ZjZTkyZjkwZmQgOTU2NjA2bXMgYXR0ZW1wdCAjMlxuICAgICBucG0gaHR0cCBmZXRjaCBHRVQgMjAwIGh0dHA6Ly9sb2NhbGhvc3Q6NDg3My9Ac2NvcGUlMmZ0ZXN0MT93cml0ZT10cnVlIDE2MDFtc1xuICAgICBucG0gaHR0cCBmZXRjaCBERUxFVEUgMjAxIGh0dHA6Ly9sb2NhbGhvc3Q6NDg3My9Ac2NvcGUlMmZ0ZXN0MS8tL3Rlc3QxLTEuMC4zLnRnei8tcmV2LzE2LWUxMWM4ZGIyODJiMmQ5OTIgMTltc1xuICAgKlxuICAgKiAzLiBTdGFyIGEgcGFja2FnZVxuICAgKlxuICAgKiBQZXJtaXNzaW9uczogc3RhcnQgYSBwYWNrYWdlIGRlcGVuZHMgb2YgdGhlIHB1Ymxpc2ggYW5kIHVucHVibGlzaCBwZXJtaXNzaW9ucywgdGhlcmUgaXMgbm8gc3BlY2lmaWMgZmxhZyBmb3Igc3RhciBvciB1biBzdGFydC5cbiAgICogVGhlIFVSTCBmb3Igc3RhciBpcyBzaW1pbGFyIHRvIHRoZSB1bnB1Ymxpc2ggKGNoYW5nZSBwYWNrYWdlIGZvcm1hdClcbiAgICpcbiAgICogbnBtIGhhcyBubyBlbnBvaW50IGZvciBzdGFyIGEgcGFja2FnZSwgcmF0aGVyIG11dGF0ZSB0aGUgbWV0YWRhdGEgYW5kIGFjdHMgYXMsIHRoZSBkaWZmZXJlbmNlIGlzIHRoZVxuICAgKiB1c2VycyBwcm9wZXJ0eSB3aGljaCBpcyBwYXJ0IG9mIHRoZSBwYXlsb2FkIGFuZCB0aGUgYm9keSBvbmx5IGluY2x1ZGVzXG4gICAqXG4gICAqIHtcblx0XHQgIFwiX2lkXCI6IHBrZ05hbWUsXG5cdCAgXHRcIl9yZXZcIjogXCIzLWIwY2RhZWZjOWJkYjc3YzhcIixcblx0XHQgIFwidXNlcnNcIjoge1xuXHRcdCAgICBbdXNlcm5hbWVdOiBib29sZWFuIHZhbHVlICh0cnVlLCBmYWxzZSlcblx0XHQgIH1cblx0fVxuICAgKlxuICAgKi9cbiAgcm91dGVyLnB1dChcbiAgICAnLzpwYWNrYWdlLzpfcmV2Py86cmV2aXNpb24/JyxcbiAgICBjYW4oJ3B1Ymxpc2gnKSxcbiAgICBtZWRpYShtaW1lLmdldFR5cGUoJ2pzb24nKSksXG4gICAgZXhwZWN0SnNvbixcbiAgICBwdWJsaXNoUGFja2FnZShzdG9yYWdlLCBjb25maWcsIGF1dGgpXG4gICk7XG5cbiAgLyoqXG4gICAqIFVuLXB1Ymxpc2hpbmcgYW4gZW50aXJlIHBhY2thZ2UuXG4gICAqXG4gICAqIFRoaXMgc2NlbmFyaW8gaGFwcGVucyB3aGVuIHRoZSBmaXJzdCBjYWxsIGRldGVjdCB0aGVyZSBpcyBvbmx5IG9uZSB2ZXJzaW9uIHJlbWFpbmluZ1xuICAgKiBpbiB0aGUgbWV0YWRhdGEsIHRoZW4gdGhlIGNsaWVudCBkZWNpZGVzIHRvIERFTEVURSB0aGUgcmVzb3VyY2VcbiAgICogbnBtIGh0dHAgZmV0Y2ggR0VUIDMwNCBodHRwOi8vbG9jYWxob3N0OjQ4NzMvQHNjb3BlJTJmdGVzdDE/d3JpdGU9dHJ1ZSAxMDc2bXMgKGZyb20gY2FjaGUpXG4gICAgIG5wbSBodHRwIGZldGNoIERFTEVURSAyMDEgaHR0cDovL2xvY2FsaG9zdDo0ODczL0BzY29wZSUyZnRlc3QxLy1yZXYvMTgtZDhlYmUzMDIwYmQ0YWM5YyAyMm1zXG4gICAqL1xuICByb3V0ZXIuZGVsZXRlKCcvOnBhY2thZ2UvLXJldi8qJywgY2FuKCd1bnB1Ymxpc2gnKSwgdW5QdWJsaXNoUGFja2FnZShzdG9yYWdlKSk7XG5cbiAgLy8gcmVtb3ZpbmcgYSB0YXJiYWxsXG4gIHJvdXRlci5kZWxldGUoXG4gICAgJy86cGFja2FnZS8tLzpmaWxlbmFtZS8tcmV2LzpyZXZpc2lvbicsXG4gICAgY2FuKCd1bnB1Ymxpc2gnKSxcbiAgICBjYW4oJ3B1Ymxpc2gnKSxcbiAgICByZW1vdmVUYXJiYWxsKHN0b3JhZ2UpXG4gICk7XG5cbiAgLy8gdXBsb2FkaW5nIHBhY2thZ2UgdGFyYmFsbFxuICByb3V0ZXIucHV0KFxuICAgICcvOnBhY2thZ2UvLS86ZmlsZW5hbWUvKicsXG4gICAgY2FuKCdwdWJsaXNoJyksXG4gICAgbWVkaWEoSEVBREVSUy5PQ1RFVF9TVFJFQU0pLFxuICAgIHVwbG9hZFBhY2thZ2VUYXJiYWxsKHN0b3JhZ2UpXG4gICk7XG5cbiAgLy8gb25seSB1c2VkIGZvciBkZXZlbG9wbWVudFxuICBpZiAoY29uZmlnLl9kZWJ1Zykge1xuICAgIC8vIGFkZGluZyBhIHZlcnNpb25cbiAgICByb3V0ZXIucHV0KFxuICAgICAgJy86cGFja2FnZS86dmVyc2lvbi8tdGFnLzp0YWcnLFxuICAgICAgY2FuKCdwdWJsaXNoJyksXG4gICAgICBtZWRpYShtaW1lLmdldFR5cGUoJ2pzb24nKSksXG4gICAgICBleHBlY3RKc29uLFxuICAgICAgYWRkVmVyc2lvbihzdG9yYWdlKVxuICAgICk7XG4gIH1cbn1cblxuLyoqXG4gKiBQdWJsaXNoIGEgcGFja2FnZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHVibGlzaFBhY2thZ2Uoc3RvcmFnZTogU3RvcmFnZSwgY29uZmlnOiBDb25maWcsIGF1dGg6IEF1dGgpOiBhbnkge1xuICBjb25zdCBzdGFyQXBpID0gc3RhcihzdG9yYWdlKTtcbiAgcmV0dXJuIGZ1bmN0aW9uIChyZXE6ICRSZXF1ZXN0RXh0ZW5kLCByZXM6ICRSZXNwb25zZUV4dGVuZCwgbmV4dDogJE5leHRGdW5jdGlvblZlcik6IHZvaWQge1xuICAgIGNvbnN0IHBhY2thZ2VOYW1lID0gcmVxLnBhcmFtcy5wYWNrYWdlO1xuICAgIGRlYnVnKCdwdWJsaXNoaW5nIG9yIHVwZGF0aW5nIGEgbmV3IHZlcnNpb24gZm9yICVvJywgcGFja2FnZU5hbWUpO1xuICAgIC8qKlxuICAgICAqIFdyaXRlIHRhcmJhbGwgb2Ygc3RyZWFtIGRhdGEgZnJvbSBwYWNrYWdlIGNsaWVudHMuXG4gICAgICovXG4gICAgY29uc3QgY3JlYXRlVGFyYmFsbCA9IGZ1bmN0aW9uIChmaWxlbmFtZTogc3RyaW5nLCBkYXRhLCBjYjogQ2FsbGJhY2spOiB2b2lkIHtcbiAgICAgIGNvbnN0IHN0cmVhbSA9IHN0b3JhZ2UuYWRkVGFyYmFsbChwYWNrYWdlTmFtZSwgZmlsZW5hbWUpO1xuICAgICAgc3RyZWFtLm9uKCdlcnJvcicsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgY2IoZXJyKTtcbiAgICAgIH0pO1xuICAgICAgc3RyZWFtLm9uKCdzdWNjZXNzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBjYigpO1xuICAgICAgfSk7XG4gICAgICAvLyB0aGlzIGlzIGR1bWIgYW5kIG1lbW9yeS1jb25zdW1pbmcsIGJ1dCB3aGF0IGNob2ljZXMgZG8gd2UgaGF2ZT9cbiAgICAgIC8vIGZsb3c6IHdlIG5lZWQgZmlyc3QgcmVmYWN0b3IgdGhpcyBmaWxlIGJlZm9yZSBkZWNpZGVzIHdoaWNoIHR5cGUgdXNlIGhlcmVcbiAgICAgIHN0cmVhbS5lbmQoQnVmZmVyLmZyb20oZGF0YS5kYXRhLCAnYmFzZTY0JykpO1xuICAgICAgc3RyZWFtLmRvbmUoKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQWRkIG5ldyBwYWNrYWdlIHZlcnNpb24gaW4gc3RvcmFnZVxuICAgICAqL1xuICAgIGNvbnN0IGNyZWF0ZVZlcnNpb24gPSBmdW5jdGlvbiAodmVyc2lvbjogc3RyaW5nLCBtZXRhZGF0YTogVmVyc2lvbiwgY2I6IENhbGxiYWNrKTogdm9pZCB7XG4gICAgICBzdG9yYWdlLmFkZFZlcnNpb24ocGFja2FnZU5hbWUsIHZlcnNpb24sIG1ldGFkYXRhLCBudWxsLCBjYik7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEFkZCBuZXcgdGFncyBpbiBzdG9yYWdlXG4gICAgICovXG4gICAgY29uc3QgYWRkVGFncyA9IGZ1bmN0aW9uICh0YWdzOiBNZXJnZVRhZ3MsIGNiOiBDYWxsYmFjayk6IHZvaWQge1xuICAgICAgc3RvcmFnZS5tZXJnZVRhZ3MocGFja2FnZU5hbWUsIHRhZ3MsIGNiKTtcbiAgICB9O1xuXG4gICAgY29uc3QgYWZ0ZXJDaGFuZ2UgPSBmdW5jdGlvbiAoZXJyb3IsIG9rTWVzc2FnZSwgbWV0YWRhdGEpOiB2b2lkIHtcbiAgICAgIGNvbnN0IG1ldGFkYXRhQ29weTogUGFja2FnZSA9IHsgLi4ubWV0YWRhdGEgfTtcblxuICAgICAgY29uc3QgeyBfYXR0YWNobWVudHMsIHZlcnNpb25zIH0gPSBtZXRhZGF0YUNvcHk7XG5cbiAgICAgIC8vIGBucG0gc3RhcmAgd291bGRuJ3QgaGF2ZSBhdHRhY2htZW50c1xuICAgICAgLy8gYW5kIGBucG0gZGVwcmVjYXRlYCB3b3VsZCBoYXZlIGF0dGFjaG1lbnRzIGFzIGEgZW1wdHkgb2JqZWN0LCBpLmUge31cbiAgICAgIGlmIChfLmlzTmlsKF9hdHRhY2htZW50cykgfHwgSlNPTi5zdHJpbmdpZnkoX2F0dGFjaG1lbnRzKSA9PT0gJ3t9Jykge1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICByZXR1cm4gbmV4dChlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgcmVzLnN0YXR1cyhIVFRQX1NUQVRVUy5DUkVBVEVEKTtcbiAgICAgICAgcmV0dXJuIG5leHQoe1xuICAgICAgICAgIG9rOiBva01lc3NhZ2UsXG4gICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIG5wbS1yZWdpc3RyeS1jbGllbnQgMC4zKyBlbWJlZHMgdGFyYmFsbCBpbnRvIHRoZSBqc29uIHVwbG9hZFxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2lzYWFjcy9ucG0tcmVnaXN0cnktY2xpZW50L2NvbW1pdC9lOWZiZWI4YjY3ZjI0OTM5NGY3MzVjNzRlZjExZmU0NzIwZDQ2Y2EwXG4gICAgICAvLyBpc3N1ZSBodHRwczovL2dpdGh1Yi5jb20vcmxpZHdrYS9zaW5vcGlhL2lzc3Vlcy8zMSwgZGVhbGluZyB3aXRoIGl0IGhlcmU6XG4gICAgICBjb25zdCBpc0ludmFsaWRCb2R5Rm9ybWF0ID1cbiAgICAgICAgaXNPYmplY3QoX2F0dGFjaG1lbnRzKSA9PT0gZmFsc2UgfHxcbiAgICAgICAgaGFzRGlmZk9uZUtleShfYXR0YWNobWVudHMpIHx8XG4gICAgICAgIGlzT2JqZWN0KHZlcnNpb25zKSA9PT0gZmFsc2UgfHxcbiAgICAgICAgaGFzRGlmZk9uZUtleSh2ZXJzaW9ucyk7XG5cbiAgICAgIGlmIChpc0ludmFsaWRCb2R5Rm9ybWF0KSB7XG4gICAgICAgIC8vIG5wbSBpcyBkb2luZyBzb21ldGhpbmcgc3RyYW5nZSBhZ2FpblxuICAgICAgICAvLyBpZiB0aGlzIGhhcHBlbnMgaW4gbm9ybWFsIGNpcmN1bXN0YW5jZXMsIHJlcG9ydCBpdCBhcyBhIGJ1Z1xuICAgICAgICBsb2dnZXIuaW5mbyh7IHBhY2thZ2VOYW1lIH0sIGB3cm9uZyBwYWNrYWdlIGZvcm1hdCBvbiBwdWJsaXNoIGEgcGFja2FnZSBAe3BhY2thZ2VOYW1lfWApO1xuICAgICAgICByZXR1cm4gbmV4dChFcnJvckNvZGUuZ2V0QmFkUmVxdWVzdChBUElfRVJST1IuVU5TVVBPUlRFRF9SRUdJU1RSWV9DQUxMKSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChlcnJvciAmJiBlcnJvci5zdGF0dXMgIT09IEhUVFBfU1RBVFVTLkNPTkZMSUNUKSB7XG4gICAgICAgIHJldHVybiBuZXh0KGVycm9yKTtcbiAgICAgIH1cblxuICAgICAgLy8gYXQgdGhpcyBwb2ludCBkb2N1bWVudCBpcyBlaXRoZXIgY3JlYXRlZCBvciBleGlzdGVkIGJlZm9yZVxuICAgICAgY29uc3QgW2ZpcnN0QXR0YWNobWVudEtleV0gPSBPYmplY3Qua2V5cyhfYXR0YWNobWVudHMpO1xuXG4gICAgICBjcmVhdGVUYXJiYWxsKFxuICAgICAgICBQYXRoLmJhc2VuYW1lKGZpcnN0QXR0YWNobWVudEtleSksXG4gICAgICAgIF9hdHRhY2htZW50c1tmaXJzdEF0dGFjaG1lbnRLZXldLFxuICAgICAgICBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXh0KGVycm9yKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB2ZXJzaW9uVG9QdWJsaXNoID0gT2JqZWN0LmtleXModmVyc2lvbnMpWzBdO1xuICAgICAgICAgIGNvbnN0IHZlcnNpb25NZXRhZGF0YVRvUHVibGlzaCA9IHZlcnNpb25zW3ZlcnNpb25Ub1B1Ymxpc2hdO1xuXG4gICAgICAgICAgdmVyc2lvbk1ldGFkYXRhVG9QdWJsaXNoLnJlYWRtZSA9XG4gICAgICAgICAgICBfLmlzTmlsKHZlcnNpb25NZXRhZGF0YVRvUHVibGlzaC5yZWFkbWUpID09PSBmYWxzZVxuICAgICAgICAgICAgICA/IFN0cmluZyh2ZXJzaW9uTWV0YWRhdGFUb1B1Ymxpc2gucmVhZG1lKVxuICAgICAgICAgICAgICA6ICcnO1xuXG4gICAgICAgICAgY3JlYXRlVmVyc2lvbih2ZXJzaW9uVG9QdWJsaXNoLCB2ZXJzaW9uTWV0YWRhdGFUb1B1Ymxpc2gsIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgIHJldHVybiBuZXh0KGVycm9yKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYWRkVGFncyhtZXRhZGF0YUNvcHlbRElTVF9UQUdTXSwgYXN5bmMgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXh0KGVycm9yKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgbm90aWZ5KFxuICAgICAgICAgICAgICAgICAgbWV0YWRhdGFDb3B5LFxuICAgICAgICAgICAgICAgICAgY29uZmlnLFxuICAgICAgICAgICAgICAgICAgcmVxLnJlbW90ZV91c2VyLFxuICAgICAgICAgICAgICAgICAgYCR7bWV0YWRhdGFDb3B5Lm5hbWV9QCR7dmVyc2lvblRvUHVibGlzaH1gXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoeyBlcnJvciB9LCAnbm90aWZ5IGJhdGNoIHNlcnZpY2UgaGFzIGZhaWxlZDogQHtlcnJvcn0nKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHJlcy5zdGF0dXMoSFRUUF9TVEFUVVMuQ1JFQVRFRCk7XG4gICAgICAgICAgICAgIHJldHVybiBuZXh0KHsgb2s6IG9rTWVzc2FnZSwgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICApO1xuICAgIH07XG5cbiAgICBpZiAoaXNQdWJsaXNoYWJsZVBhY2thZ2UocmVxLmJvZHkpID09PSBmYWxzZSAmJiBpc09iamVjdChyZXEuYm9keS51c2VycykpIHtcbiAgICAgIHJldHVybiBzdGFyQXBpKHJlcSwgcmVzLCBuZXh0KTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgbWV0YWRhdGEgPSB2YWxpZGF0aW9uVXRpbHMubm9ybWFsaXplTWV0YWRhdGEocmVxLmJvZHksIHBhY2thZ2VOYW1lKTtcbiAgICAgIC8vIGNoZWNrIF9hdHRhY2htZW50cyB0byBkaXN0aW5ndWlzaCBwdWJsaXNoIGFuZCBkZXByZWNhdGVcbiAgICAgIGlmIChcbiAgICAgICAgcmVxLnBhcmFtcy5fcmV2IHx8XG4gICAgICAgIChpc1JlbGF0ZWRUb0RlcHJlY2F0aW9uKHJlcS5ib2R5KSAmJiBfLmlzRW1wdHkocmVxLmJvZHkuX2F0dGFjaG1lbnRzKSlcbiAgICAgICkge1xuICAgICAgICBkZWJ1ZygndXBkYXRpbmcgYSBuZXcgdmVyc2lvbiBmb3IgJW8nLCBwYWNrYWdlTmFtZSk7XG4gICAgICAgIC8vIHdlIGNoZWNrIHVucHVibGlzaCBwZXJtaXNzaW9ucywgYW4gdXBkYXRlIGlzIGJhc2ljYWxseSByZW1vdmUgdmVyc2lvbnNcbiAgICAgICAgY29uc3QgcmVtb3RlID0gcmVxLnJlbW90ZV91c2VyO1xuICAgICAgICBhdXRoLmFsbG93X3VucHVibGlzaCh7IHBhY2thZ2VOYW1lIH0sIHJlbW90ZSwgKGVycm9yKSA9PiB7XG4gICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoeyBwYWNrYWdlTmFtZSB9LCBgbm90IGFsbG93ZWQgdG8gdW5wdWJsaXNoIGEgdmVyc2lvbiBmb3IgQHtwYWNrYWdlTmFtZX1gKTtcbiAgICAgICAgICAgIHJldHVybiBuZXh0KGVycm9yKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc3RvcmFnZS5jaGFuZ2VQYWNrYWdlKHBhY2thZ2VOYW1lLCBtZXRhZGF0YSwgcmVxLnBhcmFtcy5yZXZpc2lvbiwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBhZnRlckNoYW5nZShlcnJvciwgQVBJX01FU1NBR0UuUEtHX0NIQU5HRUQsIG1ldGFkYXRhKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWJ1ZygnYWRkaW5nIGEgbmV3IHZlcnNpb24gZm9yICVvJywgcGFja2FnZU5hbWUpO1xuICAgICAgICBzdG9yYWdlLmFkZFBhY2thZ2UocGFja2FnZU5hbWUsIG1ldGFkYXRhLCBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICBhZnRlckNoYW5nZShlcnJvciwgQVBJX01FU1NBR0UuUEtHX0NSRUFURUQsIG1ldGFkYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgZGVidWcoJ2Vycm9yIG9uIHB1Ymxpc2g6ICVzJywgZXJyb3IubWVzc2FnZSk7XG4gICAgICBsb2dnZXIuZXJyb3IoeyBwYWNrYWdlTmFtZSB9LCAnZXJyb3Igb24gcHVibGlzaCwgYmFkIHBhY2thZ2UgZGF0YSBmb3IgQHtwYWNrYWdlTmFtZX0nKTtcbiAgICAgIHJldHVybiBuZXh0KEVycm9yQ29kZS5nZXRCYWREYXRhKEFQSV9FUlJPUi5CQURfUEFDS0FHRV9EQVRBKSk7XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIHVuLXB1Ymxpc2ggYSBwYWNrYWdlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1blB1Ymxpc2hQYWNrYWdlKHN0b3JhZ2U6IFN0b3JhZ2UpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChyZXE6ICRSZXF1ZXN0RXh0ZW5kLCByZXM6ICRSZXNwb25zZUV4dGVuZCwgbmV4dDogJE5leHRGdW5jdGlvblZlcik6IHZvaWQge1xuICAgIGNvbnN0IHBhY2thZ2VOYW1lID0gcmVxLnBhcmFtcy5wYWNrYWdlO1xuICAgIGRlYnVnKCd1bnB1Ymxpc2hpbmcgJW8nLCBwYWNrYWdlTmFtZSk7XG4gICAgc3RvcmFnZS5yZW1vdmVQYWNrYWdlKHBhY2thZ2VOYW1lLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBuZXh0KGVycik7XG4gICAgICB9XG4gICAgICByZXMuc3RhdHVzKEhUVFBfU1RBVFVTLkNSRUFURUQpO1xuICAgICAgcmV0dXJuIG5leHQoeyBvazogQVBJX01FU1NBR0UuUEtHX1JFTU9WRUQgfSk7XG4gICAgfSk7XG4gIH07XG59XG5cbi8qKlxuICogRGVsZXRlIHRhcmJhbGxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZVRhcmJhbGwoc3RvcmFnZTogU3RvcmFnZSkge1xuICByZXR1cm4gZnVuY3Rpb24gKHJlcTogJFJlcXVlc3RFeHRlbmQsIHJlczogJFJlc3BvbnNlRXh0ZW5kLCBuZXh0OiAkTmV4dEZ1bmN0aW9uVmVyKTogdm9pZCB7XG4gICAgY29uc3QgcGFja2FnZU5hbWUgPSByZXEucGFyYW1zLnBhY2thZ2U7XG4gICAgY29uc3QgeyBmaWxlbmFtZSwgcmV2aXNpb24gfSA9IHJlcS5wYXJhbXM7XG4gICAgZGVidWcoJ3JlbW92aW5nIGEgdGFyYmFsbCBmb3IgJW8tJW8tJW8nLCBwYWNrYWdlTmFtZSwgZmlsZW5hbWUsIHJldmlzaW9uKTtcbiAgICBzdG9yYWdlLnJlbW92ZVRhcmJhbGwocGFja2FnZU5hbWUsIGZpbGVuYW1lLCByZXZpc2lvbiwgZnVuY3Rpb24gKGVycikge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gbmV4dChlcnIpO1xuICAgICAgfVxuICAgICAgcmVzLnN0YXR1cyhIVFRQX1NUQVRVUy5DUkVBVEVEKTtcbiAgICAgIGRlYnVnKCdzdWNjZXNzIHJlbW92ZSB0YXJiYWxsIGZvciAlby0lby0lbycsIHBhY2thZ2VOYW1lLCBmaWxlbmFtZSwgcmV2aXNpb24pO1xuICAgICAgcmV0dXJuIG5leHQoeyBvazogQVBJX01FU1NBR0UuVEFSQkFMTF9SRU1PVkVEIH0pO1xuICAgIH0pO1xuICB9O1xufVxuLyoqXG4gKiBBZGRzIGEgbmV3IHZlcnNpb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFZlcnNpb24oc3RvcmFnZTogU3RvcmFnZSkge1xuICByZXR1cm4gZnVuY3Rpb24gKHJlcTogJFJlcXVlc3RFeHRlbmQsIHJlczogJFJlc3BvbnNlRXh0ZW5kLCBuZXh0OiAkTmV4dEZ1bmN0aW9uVmVyKTogdm9pZCB7XG4gICAgY29uc3QgeyB2ZXJzaW9uLCB0YWcgfSA9IHJlcS5wYXJhbXM7XG4gICAgY29uc3QgcGFja2FnZU5hbWUgPSByZXEucGFyYW1zLnBhY2thZ2U7XG5cbiAgICBzdG9yYWdlLmFkZFZlcnNpb24ocGFja2FnZU5hbWUsIHZlcnNpb24sIHJlcS5ib2R5LCB0YWcsIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIHJldHVybiBuZXh0KGVycm9yKTtcbiAgICAgIH1cblxuICAgICAgcmVzLnN0YXR1cyhIVFRQX1NUQVRVUy5DUkVBVEVEKTtcbiAgICAgIHJldHVybiBuZXh0KHtcbiAgICAgICAgb2s6IEFQSV9NRVNTQUdFLlBLR19QVUJMSVNIRUQsXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcbn1cblxuLyoqXG4gKiB1cGxvYWRQYWNrYWdlVGFyYmFsbFxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBsb2FkUGFja2FnZVRhcmJhbGwoc3RvcmFnZTogU3RvcmFnZSkge1xuICByZXR1cm4gZnVuY3Rpb24gKHJlcTogJFJlcXVlc3RFeHRlbmQsIHJlczogJFJlc3BvbnNlRXh0ZW5kLCBuZXh0OiAkTmV4dEZ1bmN0aW9uVmVyKTogdm9pZCB7XG4gICAgY29uc3QgcGFja2FnZU5hbWUgPSByZXEucGFyYW1zLnBhY2thZ2U7XG4gICAgY29uc3Qgc3RyZWFtID0gc3RvcmFnZS5hZGRUYXJiYWxsKHBhY2thZ2VOYW1lLCByZXEucGFyYW1zLmZpbGVuYW1lKTtcbiAgICByZXEucGlwZShzdHJlYW0pO1xuXG4gICAgLy8gY2hlY2tpbmcgaWYgZW5kIGV2ZW50IGNhbWUgYmVmb3JlIGNsb3NpbmdcbiAgICBsZXQgY29tcGxldGUgPSBmYWxzZTtcbiAgICByZXEub24oJ2VuZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbXBsZXRlID0gdHJ1ZTtcbiAgICAgIHN0cmVhbS5kb25lKCk7XG4gICAgfSk7XG5cbiAgICByZXEub24oJ2Nsb3NlJywgZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCFjb21wbGV0ZSkge1xuICAgICAgICBzdHJlYW0uYWJvcnQoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHN0cmVhbS5vbignZXJyb3InLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICByZXR1cm4gcmVzLmxvY2Fscy5yZXBvcnRfZXJyb3IoZXJyKTtcbiAgICB9KTtcblxuICAgIHN0cmVhbS5vbignc3VjY2VzcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJlcy5zdGF0dXMoSFRUUF9TVEFUVVMuQ1JFQVRFRCk7XG4gICAgICByZXR1cm4gbmV4dCh7XG4gICAgICAgIG9rOiBBUElfTUVTU0FHRS5UQVJCQUxMX1VQTE9BREVELFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsSUFBQUEsTUFBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBRUEsSUFBQUMsT0FBQSxHQUFBRixzQkFBQSxDQUFBQyxP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