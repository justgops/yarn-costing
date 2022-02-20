var router = require('express').Router();
const db = require('../db/models');
const si = require('systeminformation');
const {encrypt, decrypt, getEpoch} = require('../src/utils');

function toQWERTY(text, decode) {
  var map = {
      a: 'q', b: 'w', c: 'e',
      d: 'r', e: 't', f: 'y',
      g: 'u', h: 'i', i: 'o',
      j: 'p', k: 'a', l: 's',
      m: 'd', n: 'f', o: 'g',
      p: 'h', q: 'j', r: 'k',
      s: 'l', t: 'z', u: 'x',
      v: 'c', w: 'v', x: 'b',
      y: 'n', z: 'm'
  };

  // Flip the map
  if(decode) {
      map = (function() {
          var tmp = {};
          var k;

          // Populate the tmp variable
          for(k in map) {
              if(!map.hasOwnProperty(k)) continue;
              tmp[map[k]] = k;
          }

          return tmp;
      })();
  }

  return text.split('').filter(function(v) {
      // Filter out characters that are not in our list
      return map.hasOwnProperty(v.toLowerCase());
  }).map(function(v) {
      // Replace old character by new one
      // And make it uppercase to make it look fancier
      return map[v.toLowerCase()].toUpperCase();
  }).join('');
};

router.post('/init', function(req, res) {
  let system_id = '';

  si.system()
  .then((data)=>{
    system_id = system_id + data.uuid + data.serial + data.sku;

    system_id = system_id.replace(/[^A-Za-z]*/g, '');
    system_id = toQWERTY(system_id);
    system_id = system_id.substring(0, 32);

    /* Update the DB, create if no entry */
    db.Misc.findOne({
      raw: true,
    }).then((data)=>{
      let retJson = {};
      let currEpoch = getEpoch().toString();
      let currEpochEnc = encrypt(currEpoch, system_id);

      if(data) {
        db.Misc.update({
          system_id: system_id,
        }, {
          where: {}
        }).then(()=>{
          try {
            retJson = {
              install_date: decrypt(data.install_date_enc, data.system_id),
              activation_date: data.activation_date_enc ? decrypt(data.activation_date_enc, data.system_id) : null,
              system_id: system_id,
              activation_key: data.activation_key,
            };
            res.status(200).json(retJson);
          } catch(e) {
            res.status(500).json({message: 'Unexpected error occured. Contact software provided.'})
          }
        });
      } else {
        db.Misc.create({
          install_date_enc: currEpochEnc,
          activation_date_enc: null,
          system_id: system_id,
          activation_key: null,
        }).then((data)=>{
          retJson = {
            install_date: decrypt(data.install_date_enc, data.system_id),
            activation_date: data.activation_date_enc ? decrypt(data.activation_date_enc, data.system_id) : null,
            system_id: data.system_id,
            activation_key: data.activation_key,
          };
          res.status(200).json(retJson);
        });
      }
    });
  }).catch(()=>{
    res.status(500).json({message: 'Unexpected error occured. Contact software provided.'})
  });
});

router.post('/activate', function(req, res) {
  /* Key format - <appid>:<timestamp>:<exptype>:<expvalue> */
  let reqJson = req.body;

  db.Misc.findOne().then((data)=>{
    if(data) {
      let timestamp, exptype, expvalue, activation_key, activation_date;
      try {
        activation_key = decrypt(reqJson.activation_key, data.system_id);
        activation_date = getEpoch().toString();
        [appid, timestamp, exptype, expvalue] = activation_key.split(':');

        if(appid != 'costing' || exptype != 'lifetime') {
          res.status(403).json({message: 'The activation key is invalid'});
          return;
        }

        db.Misc.update({
          activation_key: reqJson.activation_key,
          activation_date_enc: encrypt(activation_date, data.system_id)
        }, {
          where: {}
        }).then((result)=>{
          res.status(200).json({
            activation_date: activation_date,
          });
        });
      } catch (error) {
        console.log(error);
        res.status(403).json({message: 'The activation key is invalid'});
      }
    } else {
      res.status(403).json({message: 'It seems the software data is tampered. Unauthorised access !!'});
    }
  });
});

router.get('/', function(req, res) {
  db.Misc.findOne({
    raw: true,
  }).then((data)=>{
    retJson.rows = data;
    retJson.present = (retJson.rows.length != 0);
    res.status(200).json(retJson);
  })
  .catch(err => {
    throw err;
  });
});

module.exports = router;