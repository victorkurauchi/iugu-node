'use strict';

const path = require('path');
const utils = require('./utils');

/**
 * Create an API method from the declared spec.
 *
 * @param [spec.method='GET'] Request Method (POST, GET, DELETE, PUT)
 * @param [spec.path=''] Path to be appended to the API BASE_PATH, joined with 
 *  the instance's path (e.g. "charges" or "customers")
 * @param [spec.required=[]] Array of required arguments in the order that they
 *  must be passed by the consumer of the API. Subsequent optional arguments are
 *  optionally passed through a hash (Object) as the penultimate argument
 *  (preceeding the also-optional callback argument
 */
module.exports = function iuguMethod(spec) {

  const commandPath = utils.makeURLInterpolator( spec.path || '' );
  const requestMethod = (spec.method || 'GET').toUpperCase();
  const urlParams = spec.urlParams || [];

  return function() {
  
    let self = this;
    let args = [].slice.call(arguments);

    const callback = typeof args[args.length - 1] == 'function' && args.pop();
    const auth = args.length > urlParams.length && utils.isAuthKey(args[args.length - 1]) ? args.pop() : null;
    const data = utils.isObject(args[args.length - 1]) ? args.pop() : {};
    const urlData = this.createUrlData();

    const deferred = this.createDeferred(callback);

    for (let i = 0, l = urlParams.length; i < l; ++i) {
      let arg = args[0];
      if (urlParams[i] && !arg) {
        throw new Error('Iugu: I require argument "' + urlParams[i] + '", but I got: ' + arg);
      }
      urlData[urlParams[i]] = args.shift();
    }

    if (args.length) {
      throw new Error(
        'Iugu: Unknown arguments (' + args + '). Did you mean to pass an options object? '
      );
    }

    let requestPath = this.createFullPath(commandPath, urlData);

    self._request(requestMethod, requestPath, data, auth, function(err, response) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(
          spec.transformResponseData ?
            spec.transformResponseData(response) :
            response
        );
      }
    });

    return deferred.promise;

  };
};