'use strict';

var express = require('express'),
  router = express.Router();

var Registry = require('azure-iothub').Registry;
var Client = require('azure-iothub').Client;
var deviceId = '';
var client,
  registry;



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

  res.render('commands', {
    title: 'utility mgmt console',
    deviceId: deviceId,
    msg: 'ready to send command to device'
  });
});

router.post('/dc', function (req, res, next) {
  var msg = '';
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
          msg: msg
        });
      });
      break;

    case 'last':
      registry.getTwin(deviceId, function (err, twin) {

        if (twin.properties.reported.iothubDM != null) {
          if (err) {
            msg = 'Could not query twins: ' + err.constructor.name + ': ' + err.message;
          } else {
            var lastRebootTime = twin.properties.reported.iothubDM.reboot.lastReboot;
            msg = 'Last reboot time: ' + JSON.stringify(lastRebootTime, null, 2);
          }
        }
        else
          msg = 'no completed reboot has been reported by device';

        res.render('commands', {
          title: 'utility mgmt console',
          deviceId: deviceId,
          msg: msg
        });

      });
      break;
    case 'location':
      registry.getTwin(deviceId, function (err, twin) {

        if (twin.properties.reported.location != null) {
          if (err) {
            msg = 'Could not query twins: ' + err.constructor.name + ': ' + err.message;
          } else {
            var location = twin.properties.reported.location.type;
            msg = 'Device Zip Code: ' + location;
          }
        }
        else
          msg = 'no location has been reported by device';
        res.render('commands', {
          title: 'utility mgmt console',
          deviceId: deviceId,
          msg: msg
        });
      })
        break;
    case 'connectivity':
      registry.getTwin(deviceId, function (err, twin) {

        if (twin.properties.reported.location != null) {
          if (err) {
            msg = 'Could not query twins: ' + err.constructor.name + ': ' + err.message;
          } else {
            var location = twin.properties.reported.connectivity.type;
            msg = 'Connectivity Type: ' + location;
          }
        }
        else
          msg = 'no connectivity has been reported by device';
        res.render('commands', {
          title: 'utility mgmt console',
          deviceId: deviceId,
          msg: msg
        });
      })
        break;
  }


});



