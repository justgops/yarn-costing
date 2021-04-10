const Sequelize = require('sequelize');
var router = require('express').Router();
const db = require('../db/models');

router.get('/', function(req, res, next) {
  db.WAGETYPE.findAll({
    order: [['wagetype', 'ASC']],
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
  db.WAGETYPE.findOne({
    order: [['wagetype', 'ASC']],
    raw: true,
  }).then((data)=>{
    res.status(200).json(data);
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
});

router.get('/:id', function(req, res) {
  db.WAGETYPE.findOne({
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
  db.WAGETYPE.destroy({
    where: {
      id: req.params.id,
    },
  }).then((data)=>{
    res.status(200).json({success : "Wage Type deleted successfully", status : 200});
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
});

router.post('/', function(req, res) {
  let reqJson = req.body;
  db.WAGETYPE.create({
    wagetype : reqJson.wagetype,
    desc : reqJson.desc,
    unit : reqJson.unit,
  }).then((result)=>{
    res.status(200).json(result);
    //res.status(200).json({success : "Wage Type added successfully", status : 200});
  }).catch((error)=>{
    res.status(500).json({message: error});
  });
});

router.put('/:id', function(req, res) {
  let reqJson = req.body;
  db.WAGETYPE.update({
    wagetype : reqJson.wagetype,
    desc : reqJson.desc,
    unit : reqJson.unit,
  },{
    where: {
      id: reqJson.id,
    },
  }).then(()=>{
    res.status(200).json({success : "Wage Type updated Successfully", status : 200});
  }).catch((error)=>{
    res.status(500).json({message: error});
  });
});

module.exports = router;