var router = require('express').Router();
const db = require('../db/models');

router.get('/', function(req, res, next) {
  db.Settings.findOne({
    raw: true,
  }).then((data)=>{
    res.status(200).json(data.value);
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    next(err);
  });
});

router.put('/', function(req, res) {
  console.log(req.body);
  db.Settings.update({
    value: JSON.stringify(req.body),
  }, {
    where: {}
  }).then((data)=>{
    res.status(200).json(data);
  }).catch((error)=>{
    console.log(error);
    res.status(500).json({message: error});
  });
});

module.exports = router;