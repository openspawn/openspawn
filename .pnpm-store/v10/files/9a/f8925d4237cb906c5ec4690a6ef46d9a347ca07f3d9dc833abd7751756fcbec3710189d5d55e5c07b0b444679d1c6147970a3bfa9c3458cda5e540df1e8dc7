"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;
var _middleware = require("@verdaccio/middleware");
var _constants = require("../../../lib/constants");
var _logger = require("../../../lib/logger");
function _default(route, auth, storage) {
  // searching packages
  route.get(_middleware.SEARCH_API_ENDPOINTS.deprecated_search, function (req, res) {
    let received_end = false;
    let response_finished = false;
    let processing_pkgs = 0;
    let firstPackage = true;
    _logger.logger.warn('/-/all search endpoint is deprecated, might be removed in the next major release');
    res.status(200);
    res.set(_constants.HEADERS.CONTENT_TYPE, _constants.HEADERS.JSON_CHARSET);

    /*
     * Offical NPM registry (registry.npmjs.org) no longer return whole database,
     * They only return packages matched with keyword in `referer: search pkg-name`,
     * And NPM client will request server in every search.
     *
     * The magic number 99999 was sent by NPM registry. Modify it may caused strange
     * behaviour in the future.
     *
     * BTW: NPM will not return result if user-agent does not contain string 'npm',
     * See: method 'request' in up-storage.js
     *
     * If there is no cache in local, NPM will request /-/all, then get response with
     * _updated: 99999, 'Date' in response header was Mon, 10 Oct 1983 00:12:48 GMT,
     * this will make NPM always query from server
     *
     * Data structure also different, whel request /-/all, response is an object, but
     * when request /-/all/since, response is an array
     */
    const respShouldBeArray = req.path.endsWith('/since');
    if (!respShouldBeArray) {
      res.set('Date', 'Mon, 10 Oct 1983 00:12:48 GMT');
    }
    const check_finish = function () {
      if (!received_end) {
        return;
      }
      if (processing_pkgs) {
        return;
      }
      if (response_finished) {
        return;
      }
      response_finished = true;
      if (respShouldBeArray) {
        res.end(']\n');
      } else {
        res.end('}\n');
      }
    };
    if (respShouldBeArray) {
      res.write('[');
    } else {
      res.write('{"_updated":' + 99999);
    }
    const stream = storage.search(req.query.startkey || 0, {
      req: req
    });
    stream.on('data', function each(pkg) {
      processing_pkgs++;
      auth.allow_access({
        packageName: pkg.name
      }, req.remote_user, function (err, allowed) {
        processing_pkgs--;
        if (err) {
          if (err.status && String(err.status).match(/^4\d\d$/)) {
            // auth plugin returns 4xx user error,
            // that's equivalent of !allowed basically
            allowed = false;
          } else {
            stream.abort(err);
          }
        }
        if (allowed) {
          if (respShouldBeArray) {
            res.write(`${firstPackage ? '' : ','}${JSON.stringify(pkg)}\n`);
            if (firstPackage) {
              firstPackage = false;
            }
          } else {
            res.write(',\n' + JSON.stringify(pkg.name) + ':' + JSON.stringify(pkg));
          }
        }
        check_finish();
      });
    });
    stream.on('error', function (err) {
      _logger.logger.error('search `/-/all endpoint has failed @{err}', err);
      received_end = true;
      check_finish();
    });
    stream.on('end', function () {
      received_end = true;
      check_finish();
    });
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfbWlkZGxld2FyZSIsInJlcXVpcmUiLCJfY29uc3RhbnRzIiwiX2xvZ2dlciIsIl9kZWZhdWx0Iiwicm91dGUiLCJhdXRoIiwic3RvcmFnZSIsImdldCIsIlNFQVJDSF9BUElfRU5EUE9JTlRTIiwiZGVwcmVjYXRlZF9zZWFyY2giLCJyZXEiLCJyZXMiLCJyZWNlaXZlZF9lbmQiLCJyZXNwb25zZV9maW5pc2hlZCIsInByb2Nlc3NpbmdfcGtncyIsImZpcnN0UGFja2FnZSIsImxvZ2dlciIsIndhcm4iLCJzdGF0dXMiLCJzZXQiLCJIRUFERVJTIiwiQ09OVEVOVF9UWVBFIiwiSlNPTl9DSEFSU0VUIiwicmVzcFNob3VsZEJlQXJyYXkiLCJwYXRoIiwiZW5kc1dpdGgiLCJjaGVja19maW5pc2giLCJlbmQiLCJ3cml0ZSIsInN0cmVhbSIsInNlYXJjaCIsInF1ZXJ5Iiwic3RhcnRrZXkiLCJvbiIsImVhY2giLCJwa2ciLCJhbGxvd19hY2Nlc3MiLCJwYWNrYWdlTmFtZSIsIm5hbWUiLCJyZW1vdGVfdXNlciIsImVyciIsImFsbG93ZWQiLCJTdHJpbmciLCJtYXRjaCIsImFib3J0IiwiSlNPTiIsInN0cmluZ2lmeSIsImVycm9yIl0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaS9lbmRwb2ludC9hcGkvc2VhcmNoLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNFQVJDSF9BUElfRU5EUE9JTlRTIH0gZnJvbSAnQHZlcmRhY2Npby9taWRkbGV3YXJlJztcblxuaW1wb3J0IHsgSEVBREVSUyB9IGZyb20gJy4uLy4uLy4uL2xpYi9jb25zdGFudHMnO1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vLi4vLi4vbGliL2xvZ2dlcic7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChyb3V0ZSwgYXV0aCwgc3RvcmFnZSk6IHZvaWQge1xuICAvLyBzZWFyY2hpbmcgcGFja2FnZXNcbiAgcm91dGUuZ2V0KFNFQVJDSF9BUElfRU5EUE9JTlRTLmRlcHJlY2F0ZWRfc2VhcmNoLCBmdW5jdGlvbiAocmVxLCByZXMpIHtcbiAgICBsZXQgcmVjZWl2ZWRfZW5kID0gZmFsc2U7XG4gICAgbGV0IHJlc3BvbnNlX2ZpbmlzaGVkID0gZmFsc2U7XG4gICAgbGV0IHByb2Nlc3NpbmdfcGtncyA9IDA7XG4gICAgbGV0IGZpcnN0UGFja2FnZSA9IHRydWU7XG4gICAgbG9nZ2VyLndhcm4oJy8tL2FsbCBzZWFyY2ggZW5kcG9pbnQgaXMgZGVwcmVjYXRlZCwgbWlnaHQgYmUgcmVtb3ZlZCBpbiB0aGUgbmV4dCBtYWpvciByZWxlYXNlJyk7XG4gICAgcmVzLnN0YXR1cygyMDApO1xuICAgIHJlcy5zZXQoSEVBREVSUy5DT05URU5UX1RZUEUsIEhFQURFUlMuSlNPTl9DSEFSU0VUKTtcblxuICAgIC8qXG4gICAgICogT2ZmaWNhbCBOUE0gcmVnaXN0cnkgKHJlZ2lzdHJ5Lm5wbWpzLm9yZykgbm8gbG9uZ2VyIHJldHVybiB3aG9sZSBkYXRhYmFzZSxcbiAgICAgKiBUaGV5IG9ubHkgcmV0dXJuIHBhY2thZ2VzIG1hdGNoZWQgd2l0aCBrZXl3b3JkIGluIGByZWZlcmVyOiBzZWFyY2ggcGtnLW5hbWVgLFxuICAgICAqIEFuZCBOUE0gY2xpZW50IHdpbGwgcmVxdWVzdCBzZXJ2ZXIgaW4gZXZlcnkgc2VhcmNoLlxuICAgICAqXG4gICAgICogVGhlIG1hZ2ljIG51bWJlciA5OTk5OSB3YXMgc2VudCBieSBOUE0gcmVnaXN0cnkuIE1vZGlmeSBpdCBtYXkgY2F1c2VkIHN0cmFuZ2VcbiAgICAgKiBiZWhhdmlvdXIgaW4gdGhlIGZ1dHVyZS5cbiAgICAgKlxuICAgICAqIEJUVzogTlBNIHdpbGwgbm90IHJldHVybiByZXN1bHQgaWYgdXNlci1hZ2VudCBkb2VzIG5vdCBjb250YWluIHN0cmluZyAnbnBtJyxcbiAgICAgKiBTZWU6IG1ldGhvZCAncmVxdWVzdCcgaW4gdXAtc3RvcmFnZS5qc1xuICAgICAqXG4gICAgICogSWYgdGhlcmUgaXMgbm8gY2FjaGUgaW4gbG9jYWwsIE5QTSB3aWxsIHJlcXVlc3QgLy0vYWxsLCB0aGVuIGdldCByZXNwb25zZSB3aXRoXG4gICAgICogX3VwZGF0ZWQ6IDk5OTk5LCAnRGF0ZScgaW4gcmVzcG9uc2UgaGVhZGVyIHdhcyBNb24sIDEwIE9jdCAxOTgzIDAwOjEyOjQ4IEdNVCxcbiAgICAgKiB0aGlzIHdpbGwgbWFrZSBOUE0gYWx3YXlzIHF1ZXJ5IGZyb20gc2VydmVyXG4gICAgICpcbiAgICAgKiBEYXRhIHN0cnVjdHVyZSBhbHNvIGRpZmZlcmVudCwgd2hlbCByZXF1ZXN0IC8tL2FsbCwgcmVzcG9uc2UgaXMgYW4gb2JqZWN0LCBidXRcbiAgICAgKiB3aGVuIHJlcXVlc3QgLy0vYWxsL3NpbmNlLCByZXNwb25zZSBpcyBhbiBhcnJheVxuICAgICAqL1xuICAgIGNvbnN0IHJlc3BTaG91bGRCZUFycmF5ID0gcmVxLnBhdGguZW5kc1dpdGgoJy9zaW5jZScpO1xuICAgIGlmICghcmVzcFNob3VsZEJlQXJyYXkpIHtcbiAgICAgIHJlcy5zZXQoJ0RhdGUnLCAnTW9uLCAxMCBPY3QgMTk4MyAwMDoxMjo0OCBHTVQnKTtcbiAgICB9XG4gICAgY29uc3QgY2hlY2tfZmluaXNoID0gZnVuY3Rpb24gKCk6IHZvaWQge1xuICAgICAgaWYgKCFyZWNlaXZlZF9lbmQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHByb2Nlc3NpbmdfcGtncykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAocmVzcG9uc2VfZmluaXNoZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcmVzcG9uc2VfZmluaXNoZWQgPSB0cnVlO1xuICAgICAgaWYgKHJlc3BTaG91bGRCZUFycmF5KSB7XG4gICAgICAgIHJlcy5lbmQoJ11cXG4nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlcy5lbmQoJ31cXG4nKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKHJlc3BTaG91bGRCZUFycmF5KSB7XG4gICAgICByZXMud3JpdGUoJ1snKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzLndyaXRlKCd7XCJfdXBkYXRlZFwiOicgKyA5OTk5OSk7XG4gICAgfVxuXG4gICAgY29uc3Qgc3RyZWFtID0gc3RvcmFnZS5zZWFyY2gocmVxLnF1ZXJ5LnN0YXJ0a2V5IHx8IDAsIHsgcmVxOiByZXEgfSk7XG5cbiAgICBzdHJlYW0ub24oJ2RhdGEnLCBmdW5jdGlvbiBlYWNoKHBrZykge1xuICAgICAgcHJvY2Vzc2luZ19wa2dzKys7XG5cbiAgICAgIGF1dGguYWxsb3dfYWNjZXNzKHsgcGFja2FnZU5hbWU6IHBrZy5uYW1lIH0sIHJlcS5yZW1vdGVfdXNlciwgZnVuY3Rpb24gKGVyciwgYWxsb3dlZCkge1xuICAgICAgICBwcm9jZXNzaW5nX3BrZ3MtLTtcblxuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgaWYgKGVyci5zdGF0dXMgJiYgU3RyaW5nKGVyci5zdGF0dXMpLm1hdGNoKC9eNFxcZFxcZCQvKSkge1xuICAgICAgICAgICAgLy8gYXV0aCBwbHVnaW4gcmV0dXJucyA0eHggdXNlciBlcnJvcixcbiAgICAgICAgICAgIC8vIHRoYXQncyBlcXVpdmFsZW50IG9mICFhbGxvd2VkIGJhc2ljYWxseVxuICAgICAgICAgICAgYWxsb3dlZCA9IGZhbHNlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHJlYW0uYWJvcnQoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYWxsb3dlZCkge1xuICAgICAgICAgIGlmIChyZXNwU2hvdWxkQmVBcnJheSkge1xuICAgICAgICAgICAgcmVzLndyaXRlKGAke2ZpcnN0UGFja2FnZSA/ICcnIDogJywnfSR7SlNPTi5zdHJpbmdpZnkocGtnKX1cXG5gKTtcbiAgICAgICAgICAgIGlmIChmaXJzdFBhY2thZ2UpIHtcbiAgICAgICAgICAgICAgZmlyc3RQYWNrYWdlID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcy53cml0ZSgnLFxcbicgKyBKU09OLnN0cmluZ2lmeShwa2cubmFtZSkgKyAnOicgKyBKU09OLnN0cmluZ2lmeShwa2cpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjaGVja19maW5pc2goKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgc3RyZWFtLm9uKCdlcnJvcicsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIGxvZ2dlci5lcnJvcignc2VhcmNoIGAvLS9hbGwgZW5kcG9pbnQgaGFzIGZhaWxlZCBAe2Vycn0nLCBlcnIpO1xuICAgICAgcmVjZWl2ZWRfZW5kID0gdHJ1ZTtcbiAgICAgIGNoZWNrX2ZpbmlzaCgpO1xuICAgIH0pO1xuXG4gICAgc3RyZWFtLm9uKCdlbmQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICByZWNlaXZlZF9lbmQgPSB0cnVlO1xuICAgICAgY2hlY2tfZmluaXNoKCk7XG4gICAgfSk7XG4gIH0pO1xufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFBQSxXQUFBLEdBQUFDLE9BQUE7QUFFQSxJQUFBQyxVQUFBLEdBQUFELE9BQUE7QUFDQSxJQUFBRSxPQUFBLEdBQUFGLE9BQUE7QUFFZSxTQUFBRyxTQUFVQyxLQUFLLEVBQUVDLElBQUksRUFBRUMsT0FBTyxFQUFRO0VBQ25EO0VBQ0FGLEtBQUssQ0FBQ0csR0FBRyxDQUFDQyxnQ0FBb0IsQ0FBQ0MsaUJBQWlCLEVBQUUsVUFBVUMsR0FBRyxFQUFFQyxHQUFHLEVBQUU7SUFDcEUsSUFBSUMsWUFBWSxHQUFHLEtBQUs7SUFDeEIsSUFBSUMsaUJBQWlCLEdBQUcsS0FBSztJQUM3QixJQUFJQyxlQUFlLEdBQUcsQ0FBQztJQUN2QixJQUFJQyxZQUFZLEdBQUcsSUFBSTtJQUN2QkMsY0FBTSxDQUFDQyxJQUFJLENBQUMsa0ZBQWtGLENBQUM7SUFDL0ZOLEdBQUcsQ0FBQ08sTUFBTSxDQUFDLEdBQUcsQ0FBQztJQUNmUCxHQUFHLENBQUNRLEdBQUcsQ0FBQ0Msa0JBQU8sQ0FBQ0MsWUFBWSxFQUFFRCxrQkFBTyxDQUFDRSxZQUFZLENBQUM7O0lBRW5EO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtJQUNJLE1BQU1DLGlCQUFpQixHQUFHYixHQUFHLENBQUNjLElBQUksQ0FBQ0MsUUFBUSxDQUFDLFFBQVEsQ0FBQztJQUNyRCxJQUFJLENBQUNGLGlCQUFpQixFQUFFO01BQ3RCWixHQUFHLENBQUNRLEdBQUcsQ0FBQyxNQUFNLEVBQUUsK0JBQStCLENBQUM7SUFDbEQ7SUFDQSxNQUFNTyxZQUFZLEdBQUcsU0FBQUEsQ0FBQSxFQUFrQjtNQUNyQyxJQUFJLENBQUNkLFlBQVksRUFBRTtRQUNqQjtNQUNGO01BQ0EsSUFBSUUsZUFBZSxFQUFFO1FBQ25CO01BQ0Y7TUFDQSxJQUFJRCxpQkFBaUIsRUFBRTtRQUNyQjtNQUNGO01BQ0FBLGlCQUFpQixHQUFHLElBQUk7TUFDeEIsSUFBSVUsaUJBQWlCLEVBQUU7UUFDckJaLEdBQUcsQ0FBQ2dCLEdBQUcsQ0FBQyxLQUFLLENBQUM7TUFDaEIsQ0FBQyxNQUFNO1FBQ0xoQixHQUFHLENBQUNnQixHQUFHLENBQUMsS0FBSyxDQUFDO01BQ2hCO0lBQ0YsQ0FBQztJQUVELElBQUlKLGlCQUFpQixFQUFFO01BQ3JCWixHQUFHLENBQUNpQixLQUFLLENBQUMsR0FBRyxDQUFDO0lBQ2hCLENBQUMsTUFBTTtNQUNMakIsR0FBRyxDQUFDaUIsS0FBSyxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7SUFDbkM7SUFFQSxNQUFNQyxNQUFNLEdBQUd2QixPQUFPLENBQUN3QixNQUFNLENBQUNwQixHQUFHLENBQUNxQixLQUFLLENBQUNDLFFBQVEsSUFBSSxDQUFDLEVBQUU7TUFBRXRCLEdBQUcsRUFBRUE7SUFBSSxDQUFDLENBQUM7SUFFcEVtQixNQUFNLENBQUNJLEVBQUUsQ0FBQyxNQUFNLEVBQUUsU0FBU0MsSUFBSUEsQ0FBQ0MsR0FBRyxFQUFFO01BQ25DckIsZUFBZSxFQUFFO01BRWpCVCxJQUFJLENBQUMrQixZQUFZLENBQUM7UUFBRUMsV0FBVyxFQUFFRixHQUFHLENBQUNHO01BQUssQ0FBQyxFQUFFNUIsR0FBRyxDQUFDNkIsV0FBVyxFQUFFLFVBQVVDLEdBQUcsRUFBRUMsT0FBTyxFQUFFO1FBQ3BGM0IsZUFBZSxFQUFFO1FBRWpCLElBQUkwQixHQUFHLEVBQUU7VUFDUCxJQUFJQSxHQUFHLENBQUN0QixNQUFNLElBQUl3QixNQUFNLENBQUNGLEdBQUcsQ0FBQ3RCLE1BQU0sQ0FBQyxDQUFDeUIsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFO1lBQ3JEO1lBQ0E7WUFDQUYsT0FBTyxHQUFHLEtBQUs7VUFDakIsQ0FBQyxNQUFNO1lBQ0xaLE1BQU0sQ0FBQ2UsS0FBSyxDQUFDSixHQUFHLENBQUM7VUFDbkI7UUFDRjtRQUVBLElBQUlDLE9BQU8sRUFBRTtVQUNYLElBQUlsQixpQkFBaUIsRUFBRTtZQUNyQlosR0FBRyxDQUFDaUIsS0FBSyxDQUFDLEdBQUdiLFlBQVksR0FBRyxFQUFFLEdBQUcsR0FBRyxHQUFHOEIsSUFBSSxDQUFDQyxTQUFTLENBQUNYLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDL0QsSUFBSXBCLFlBQVksRUFBRTtjQUNoQkEsWUFBWSxHQUFHLEtBQUs7WUFDdEI7VUFDRixDQUFDLE1BQU07WUFDTEosR0FBRyxDQUFDaUIsS0FBSyxDQUFDLEtBQUssR0FBR2lCLElBQUksQ0FBQ0MsU0FBUyxDQUFDWCxHQUFHLENBQUNHLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBR08sSUFBSSxDQUFDQyxTQUFTLENBQUNYLEdBQUcsQ0FBQyxDQUFDO1VBQ3pFO1FBQ0Y7UUFFQVQsWUFBWSxDQUFDLENBQUM7TUFDaEIsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0lBRUZHLE1BQU0sQ0FBQ0ksRUFBRSxDQUFDLE9BQU8sRUFBRSxVQUFVTyxHQUFHLEVBQUU7TUFDaEN4QixjQUFNLENBQUMrQixLQUFLLENBQUMsMkNBQTJDLEVBQUVQLEdBQUcsQ0FBQztNQUM5RDVCLFlBQVksR0FBRyxJQUFJO01BQ25CYyxZQUFZLENBQUMsQ0FBQztJQUNoQixDQUFDLENBQUM7SUFFRkcsTUFBTSxDQUFDSSxFQUFFLENBQUMsS0FBSyxFQUFFLFlBQVk7TUFDM0JyQixZQUFZLEdBQUcsSUFBSTtNQUNuQmMsWUFBWSxDQUFDLENBQUM7SUFDaEIsQ0FBQyxDQUFDO0VBQ0osQ0FBQyxDQUFDO0FBQ0oiLCJpZ25vcmVMaXN0IjpbXX0=