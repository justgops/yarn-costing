const Sequelize = require('sequelize');
var router = require('express').Router();
const db = require('../db/models');

router.get('/', function(req, res, next) {
  db.PMTTYPE.findAll({
    order: [['pmttype', 'ASC']],
    raw: true,
  }).then((data)=>{
    res.status(200).json(data);
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    next(err);
  });
});

router.get('/default', function(req, res) {
  db.PMTTYPE.findOne({
    order: [['pmttype', 'ASC']],
    raw: true,
  }).then((data)=>{
    res.status(200).json(data);
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
});

router.get('/:id', function(req, res) {
  db.PMTTYPE.findOne({
    where: {
      id: req.params.id,
    },
    raw: true,
  }).then((data)=>{
    res.status(200).json(data);
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
});

router.delete('/:id', function(req, res) {
  db.PMTTYPE.destroy({
    where: {
      id: req.params.id,
    },
  }).then((data)=>{
    res.status(200).json({success : "Payment Type deleted successfully", status : 200});
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
});

router.post('/', function(req, res) {
  let reqJson = req.body;
  db.PMTTYPE.create({
    pmttype:reqJson.pmttype,
    desc :	reqJson.desc ,
  }).then((result)=>{
    res.status(200).json(result);
  }).catch((error)=>{
    res.status(500).json({message: error});
  });
});

router.put('/:id', function(req, res) {
  let reqJson = req.body;
  db.PMTTYPE.update({
    pmttype: reqJson.pmttype,
    desc :	reqJson.desc ,
  },{
    where: {
      id: reqJson.id,
    },
  }).then((result)=>{
    res.status(200).json(result);
  }).catch((error)=>{
    res.status(500).json({message: error});
  });
});

module.exports = router;