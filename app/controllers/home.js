'use strict';

var express = require('express'),
  router = express.Router();

var Registry = require('azure-iothub').Registry;
var Client = require('azure-iothub').Client;
var deviceId = '';
var connectionString = '';

var client,
  registry;

var location = 'not yet reported',
  lastRebootTime = 'not yet reported',
  connType,
  version,
  interval,
  msg;

function fetchReportedProperties(res, next) {
  registry.getTwin(deviceId, function (err, twin) {
    msg = 'reported properties';
    if (twin.properties.reported.iothubDM != null) {
      if (err) {
        msg = 'Could not query twins: ' + err.constructor.name + ': ' + err.message;
      } else {
        lastRebootTime = twin.properties.reported.iothubDM.reboot.lastReboot;
      }
    }
    if (twin.properties.reported.location != null) {
      if (err) {
        msg = 'Could not query twins: ' + err.constructor.name + ': ' + err.message;
      } else {
        location = twin.properties.reported.location.zipcode;
      }
    }
    if (twin.properties.reported.connectivity != null) {
      if (err) {
        msg = 'Could not query twins: ' + err.constructor.name + ': ' + err.message;
      } else {
        connType = twin.properties.reported.connectivity.type;
      }
    }
    if (twin.properties.reported.fw_version != null) {
      if (err) {
        msg = 'Could not query twins: ' + err.constructor.name + ': ' + err.message;
      } else {
        version = twin.properties.reported.fw_version.version;
      }
    }
    if (twin.properties.reported.interval != null) {
      if (err) {
        msg = 'Could not query twins: ' + err.constructor.name + ': ' + err.message;
      } else {
        interval = twin.properties.reported.interval.ms;
      }
    }
    res.render('twin', {
      title: 'utility mgmt console',
      deviceId: deviceId,
      location: location,
      lastRebootTime: lastRebootTime,
      connType: connType,
      version: version,
      interval: interval,
      footer: 'reported properties'
    });
  });
}

function setDesiredProperties(res, next, choice, prop) {
  registry.getTwin(deviceId, function (err, twin) {

    if (err) {
      console.error(err.constructor.name + ': ' + err.message);
    } else {

      switch (choice) {
        case 'fw':
          var patch = { properties: { desired: { fw: { version: prop } } } };
          break;

        case 'interval':
          var patch = { properties: { desired: { interval: { ms: prop } } } };
          break;
      }
      twin.update(patch, function (err) {
        if (err) {
          console.error('Could not update twin: ' + err.constructor.name + ': ' + err.message);
        } else {
          console.log(twin.deviceId + ' twin desired property updated successfully');
          console.log();
          console.log("Desired: " + JSON.stringify(twin.properties.desired));
          console.log();

          //queryTwins();

        }
      });
    }

    res.render('twindes', {
      title: 'utility mgmt console',
      deviceId: deviceId,
      location: location,
      lastRebootTime: lastRebootTime,
      connType: connType,
      version: version,
      footer: 'desired properties saved'
    });
  });

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
  fetchReportedProperties(res, next);
});

router.get('/des', function (req, res, next) {
  console.log(JSON.stringify(req.body));
  res.render('twindes', {
    title: 'utility mgmt console',
    deviceId: deviceId,
    version: version,
    interval: interval,
    footer: msg
  });
});

router.post('/des', function (req, res, next) {
  setDesiredProperties(res, next, req.body.choice, req.body.prop);
});

router.post('/twin', function (req, res, next) {
  switch (req.body.action) {
    case 'refresh':
      fetchReportedProperties(res, next);
      break;
    default:
      msg = req.body.action;
      res.render('twin', {
        title: 'utility mgmt console',
        deviceId: deviceId,
        location: location,
        lastRebootTime: lastRebootTime,
        connType: connType,
        version: version,
        footer: msg
      });
      break;
  }

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



