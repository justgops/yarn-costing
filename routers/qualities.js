const Sequelize = require('sequelize');
var router = require('express').Router();
const db = require('../db/models');

router.get('/', function(req, res, next) {
  db.Qualities.findAll({
    attributes: ['id', 'name', 'notes', 'agentId', 'partyId'],
    raw: true,
  }).then((data)=>{
    res.status(200).json(data);
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    next(err);
  });
});

router.get('/data/:id', function(req, res, next) {
  db.Qualities.findOne({
    raw: true,
    where: {
      id: req.params.id,
    },
  }).then((row)=>{
    row.data = JSON.parse(row.data);
    res.status(200).json(row);
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
    name: reqJson.name,
    notes: reqJson.notes,
	  data: JSON.stringify(reqJson.data),
    agentId: reqJson.agentId,
    partyId: reqJson.partyId,
  }).then((result)=>{
    res.status(200).json(result.id);
  }).catch((error)=>{
    res.status(500).json({message: error});
  });
});

router.put('/:id', function(req, res) {
  let id = req.params.id;
  let reqJson = req.body;
  db.Qualities.update({
    name: reqJson.name,
    notes: reqJson.notes,
	  data: JSON.stringify(reqJson.data),
    agentId: reqJson.agentId,
    partyId: reqJson.partyId,
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