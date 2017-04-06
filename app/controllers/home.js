'use strict';

var express = require('express'),
  router = express.Router();

var Registry = require('azure-iothub').Registry;
var Client = require('azure-iothub').Client;
var deviceId = '';
var connectionString = '';

var client,
  registry;

var location,
  lastRebootTime,
  connType,
  version,
  msg;

function displayTwinValues(err, twin) {
}

module.exports = function (app) {
  app.use('/', router);
};

router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'utility mgmt console'
  });
});

router.post('/', function (req, res, next) {
  var connectionString = req.body.cs;
  registry = Registry.fromConnectionString(connectionString);
  client = Client.fromConnectionString(connectionString);
  deviceId = req.body.devID;

  res.render('index', {
    title: 'utility mgmt console',
    deviceId: deviceId,
    footer: 'successfully connected'
  });
});

router.get('/twin', function (req, res, next) {
  // fetch twin properties here
  registry.getTwin(deviceId, function (err, twin) {

    console.log('twin: ' + err);

    if (twin.properties.reported.iothubDM != null) {
      if (err) {
        msg = 'Could not query twins: ' + err.constructor.name + ': ' + err.message;
      } else {
        var lastRebootTime = twin.properties.reported.iothubDM.reboot.lastReboot;
      }
    }
    if (twin.properties.reported.location != null) {
      if (err) {
        msg = 'Could not query twins: ' + err.constructor.name + ': ' + err.message;
      } else {
        var location = twin.properties.reported.location.zipcode;
      }
    }
    if (twin.properties.reported.connectivity != null) {
      if (err) {
        msg = 'Could not query twins: ' + err.constructor.name + ': ' + err.message;
      } else {
        var connType = twin.properties.reported.connectivity.type;
      }
    }
    if (twin.properties.reported.fw_version != null) {
      if (err) {
        msg = 'Could not query twins: ' + err.constructor.name + ': ' + err.message;
      } else {
        var version = twin.properties.reported.fw_version.version;
      }
    }

    res.render('twin', {
      title: 'utility mgmt console',
      deviceId: deviceId,
      location: location,
      lastRebootTime: lastRebootTime,
      connType: connType,
      version: version
    });
  });
});

router.get('/commands', function (req, res, next) {
  res.render('commands', {
    title: 'utility mgmt console',
    deviceId: deviceId
  });
});

router.post('/commands', function (req, res, next) {
  console.log('client: ' + client)
  switch (req.body.action) {
    case 'reboot':
      var methodName = "reboot";
      var msg = '';
      var methodParams = {
        methodName: methodName,
        payload: null,
        timeoutInSeconds: 30
      };

      client.invokeDeviceMethod(deviceId, methodParams, function (err, result) {
        console.log('requested reboot');

        if (err) {
          msg = "Direct method error: " + err.message;
        } else {
          msg = "Successfully invoked the device to reboot.";
        }

        res.render('commands', {
          title: 'utility mgmt console',
          deviceId: deviceId,
          footer: msg
        });
      });
      break;
  }
});



