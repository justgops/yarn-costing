const Sequelize = require('sequelize');
var router = require('express').Router();
const db = require('../db/models');

router.get('/', function(req, res, next) {
  db.TRANSACTION.findAll({
    order: [['transdate', 'DESC']],
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
  db.TRANSACTION.findOne({
    order: [['transdate', 'DESC']],
    raw: true,
  }).then((data)=>{
    res.status(200).json(data);
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
});

router.get('/:id', function(req, res) {
  db.TRANSACTION.findOne({
    where: {
      id: req.params.id,
    },
    raw: true,
    include: [
      {model: db.PMTTYPE, as: 'PMTTYPE'},
      {model: db.EMPLOYEE, as: 'EMPLOYEE'},
      {model: db.COMPANY, as: 'COMPANY'},

   ]
  }).then((data)=>{
    res.status(200).json(data);
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
});

router.delete('/:id', function(req, res) {
  db.TRANSACTION.destroy({
    where: {
      id: req.params.id,
    },
  }).then((data)=>{
    res.status(200).json({success : "Transaction deleted successfully", status : 200});
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
});

router.post('/', function(req, res) {
  let reqJson = req.body;
  db.TRANSACTION.create({
    empid : reqJson.empid,
    pmttypeid : reqJson.pmttypeid,
    compid : reqJson.compid,
    transdate : reqJson.transdate,
    amount : reqJson.amount,
    desc : reqJson.desc,

  }).then((result)=>{
    //res.status(200).json({success : "Transaction  added successfully", status : 200});
    res.status(200).json(result);
  }).catch((error)=>{
    res.status(500).json({message: error});
  });
});

router.put('/:id', function(req, res) {
  let reqJson = req.body;
  db.TRANSACTION.update({
    empid : reqJson.empid,
    pmttypeid : reqJson.pmttypeid,
    compid : reqJson.compid,
    transdate : reqJson.transdate,
    amount : reqJson.amount,
    desc : reqJson.desc,

  },{
    where: {
      id: reqJson.id,
    },
  }).then(()=>{
    res.status(200).json({success : "Transaction  updated Successfully", status : 200});
  }).catch((error)=>{
    res.status(500).json({message: error});
  });
});

module.exports = router;