const Sequelize = require('sequelize');
var router = require('express').Router();
const db = require('../db/models');

router.get('/', function(req, res, next) {
  db.Sizings.findAll({
    raw: true,
  }).then((data)=>{
    res.status(200).json(data);
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    next(err);
  });
});

router.delete('/:id', function(req, res) {
  db.Sizings.destroy({
    where: {
      id: req.params.id,
    },
  }).then((data)=>{
    res.status(200).json(data);
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
});

router.post('/', function(req, res) {
  let reqJson = req.body;
  db.Sizings.create({
    name: reqJson.name,
  }).then((result)=>{
    res.status(200).json(result.id);
  }).catch((error)=>{
    res.status(500).json({message: error});
  });
});

router.put('/:id', function(req, res) {
  let reqJson = req.body;
  db.Sizings.update({
    name: reqJson.name,
  },{
    where: {
      id: req.params.id,
    },
  }).then((data)=>{
    res.status(200).json(data);
  }).catch((error)=>{
    res.status(500).json({message: error});
  });
});

module.exports = router;