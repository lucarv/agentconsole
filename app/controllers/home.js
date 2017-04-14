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
  lastRead,
  msg;

function getDesiredProperties(res, next) {
  registry.getTwin(deviceId, function (err, twin) {
    var desiredFW = twin.properties.desired.fw.version;
    var desiredInterval = twin.properties.desired.interval.ms;

    res.render('twindes', {
      title: 'utility mgmt console',
      deviceId: deviceId,
      version: desiredFW,
      interval: desiredInterval,
      footer: 'desired properties'
    });
  })
}

function getReportedProperties(res, next) {
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

function setDesiredProperty(res, next, choice, prop) {
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
          getDesiredProperties(res, next);
        }
      });
    }

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
  getReportedProperties(res, next);
});

router.get('/des', function (req, res, next) {
  getDesiredProperties(res, next);
});

router.post('/des', function (req, res, next) {
  switch (req.body.action) {
    case 'fw':
      setDesiredProperty(res, next, 'fw', req.body.fw)
      break;
    case 'interval':
      setDesiredProperty(res, next, 'interval', req.body.interval)
      break;

  }
});

router.post('/twin', function (req, res, next) {
  switch (req.body.action) {
    case 'refresh':
      getReportedProperties(res, next);
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



