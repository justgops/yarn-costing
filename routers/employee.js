const Sequelize = require('sequelize');
var router = require('express').Router();
const db = require('../db/models');

router.get('/', function(req, res, next) {
  db.EMPLOYEE.findAll({
    order: [['id', 'ASC']],
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
  db.EMPLOYEE.findOne({
    order: [['id', 'ASC']],
    raw: true,
  }).then((data)=>{
    res.status(200).json(data);
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
});

router.get('/:id', function(req, res) {
  db.EMPLOYEE.findOne({
    where: {
      id: req.params.id,
    },
    raw: true,
    include: [
      {model: db.WAGETYPE, as: 'WAGETYPE'},
      {model: db.WORKROLE, as: 'WORKROLE'},
    ]
  }).then((data)=>{
    res.status(200).json(data);
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
});

router.delete('/:id', function(req, res) {
  db.EMPLOYEE.destroy({
    where: {
      id: req.params.id,
    },
  }).then((data)=>{
    res.status(200).json({success : "Employee deleted successfully", status : 200});
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
});

router.post('/', function(req, res) {
  let reqJson = req.body;
  db.EMPLOYEE.create({
    firstname	: reqJson.firstname,
	  lastname	: reqJson.lastname,
	  startdate:reqJson.startdate	,
	  enddate	:reqJson.enddate,
    phonenumber:reqJson.phonenumber	,
    wages : reqJson.wages,
    wagetypeid : reqJson.wagetypeid,
    roletypeid : reqJson.roletypeid,
  }).then((result)=>{
    res.status(200).json(result);
   // res.status(200).json({success : "Employee added successfully", status : 200});
  }).catch((error)=>{
    console.log(error);
    res.status(500).json({message: error});
  });
});

router.put('/:id', function(req, res) {
  let reqJson = req.body;
  db.EMPLOYEE.update({
    firstname	: reqJson.firstname,
	  lastname	: reqJson.lastname,
	  startdate:reqJson.startdate	,
	  enddate	:reqJson.enddate,
    phonenumber:reqJson.phonenumber	,
    wages : reqJson.wages,
    wagetypeid : reqJson.wagetypeid,
    roletypeid : reqJson.roletypeid,
    },{
    where: {
      id: reqJson.id,
    },
  }).then(()=>{
    res.status(200).json({success : "Employee updated Successfully", status : 200});
  }).catch((error)=>{
    console.log(error)
    res.status(500).json({message: error});
  });
});

module.exports = router;