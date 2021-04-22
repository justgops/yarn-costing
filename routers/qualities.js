const Sequelize = require('sequelize');
var router = require('express').Router();
const db = require('../db/models');

router.get('/', function(req, res, next) {
  db.Qualities.findAll({
    raw: true,
  }).then((data)=>{
    data.forEach((row)=>{
      row.data = JSON.parse(row.data);
    });
    res.status(200).json(data);
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    next(err);
  });
});

router.delete('/:id', function(req, res) {
  db.Qualities.destroy({
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
  db.Qualities.create({
	  data: JSON.stringify(reqJson),
  }).then((result)=>{
    result.dataValues.data = JSON.parse(result.dataValues.data);
    res.status(200).json(result);
  }).catch((error)=>{
    res.status(500).json({message: error});
  });
});

router.put('/:id', function(req, res) {
  let id = req.params.id;
  db.Qualities.update({
    data: JSON.stringify(req.body),
  },{
    where: {
      id: id,
    },
  }).then((data)=>{
    res.status(200).json(data);
  }).catch((error)=>{
    res.status(500).json({message: error});
  });
});

module.exports = router;