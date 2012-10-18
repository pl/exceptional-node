var http = require('http');
var zlib = require('zlib');

var PROTOCOL_VERSION = 6;
var VERSION = 1.0;

var Exceptional = {
  apiKey: undefined,

  host: "api.getexceptional.com",
  port: 80,

  handle: function(error, callback) {
    if (this.apiKey === undefined) {
      callback(new Error("Exceptional API key must be set"));
      return;
    }
    this.send(this.mapErrorToJSON(error), callback);
  },

  mapErrorToJSON: function(error) {
    return JSON.stringify({
      "application_environment": {
        "application_root_directory": process.cwd(),
        "language": "node-javascript",
        "framework": "node" + process.version,
        "env": {
          "args": process.argv,
          "execPath": process.execPath,
          "cwd": process.cwd(),
          "env": process.env,
          "gid": process.getgid(),
          "uid": process.getuid(),
          "version": process.version,
          "installPrefix": process.installPrefix,
          "pid": process.pid,
          "platform": process.platform,
          "memory": process.memoryUsage()
        }
      },

      "exception": {
        "occurred_at": new Date(),
        "message": error.message,
        "backtrace": error.stack.split("\n"),
        "exception_class": error.name || "Error",
      },
      "client": {
        "name": "Exceptional for node.js",
        "version": VERSION,
        "protocol_version": PROTOCOL_VERSION
      }
    });
  },

  send: function(doc, callback) {
    if (!Buffer.isBuffer(doc)) {
      doc = new Buffer(doc);
    }

    zlib.gzip(doc, function(err, data) {
      var options = {
        host: this.host,
        port: this.port,
        method: "POST",
        path: '/api/errors?api_key=' + this.apiKey +
          "&protocol_version=" + PROTOCOL_VERSION,
        headers: {
          'Host' : this.host,
          'Content-Length' : data.length,
        }
      }

      var request = http.request(options, function (response) {
        if (response.statusCode === 200) {
          callback(null);
        } else {
          callback(response.statusCode);
        }
      });

      request.write(data);
      request.end();
    }.bind(this));
  }
};

module.exports = Exceptional;
