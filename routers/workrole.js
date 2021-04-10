const Sequelize = require('sequelize');
var router = require('express').Router();
const db = require('../db/models');

router.get('/', function(req, res, next) {
  db.WORKROLE.findAll({
    order: [['sort_priority', 'ASC']],
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
  db.WORKROLE.findOne({
    order: [['sort_priority', 'ASC']],
    raw: true,
  }).then((data)=>{
    res.status(200).json(data);
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
});

router.get('/:id', function(req, res) {
  db.WORKROLE.findOne({
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
  db.WORKROLE.destroy({
    where: {
      id: req.params.id,
    },
  }).then((data)=>{
    res.status(200).json({success : "Work role deleted successfully", status : 200});
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
});

router.post('/', function(req, res) {
  let reqJson = req.body;
  db.WORKROLE.create({
    roletype	: reqJson.roletype,
    shifthours: reqJson.shifthours,
    rolewages: reqJson.rolewages,
    sort_priority: reqJson.sort_priority,
    desc : reqJson.desc,
  }).then((result)=>{
    res.status(200).json(result);
    //res.status(200).json({success : "Work role added successfully", status : 200});
  }).catch((error)=>{
    res.status(500).json({message: error});
  });
});

router.put('/:id', function(req, res) {
  let reqJson = req.body;
  db.WORKROLE.update({
    roletype	: reqJson.roletype,
    shifthours: reqJson.shifthours,
    rolewages: reqJson.rolewages,
    sort_priority: reqJson.sort_priority,
    desc : reqJson.desc,
  },{
    where: {
      id: reqJson.id,
    },
  }).then(()=>{
    res.status(200).json({success : "Work role updated Successfully", status : 200});
  }).catch((error)=>{
    res.status(500).json({message: error});
  });
});

module.exports = router;