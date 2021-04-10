const Sequelize = require('sequelize');
var router = require('express').Router();
const db = require('../db/models');

router.get('/', function(req, res, next) {
  db.DAILYATTENDANCE.findAll({
    order: [['firstin', 'ASC']],
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
  db.DAILYATTENDANCE.findOne({
    order: [['firstin', 'ASC']],
    raw: true,
  }).then((data)=>{
    res.status(200).json(data);
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
});

router.get('/:id', function(req, res) {
  console.log(req.query);
  let where = {
    empid: req.params.id,
    firstin: {
      $between: [req.query.fromdate, req.query.todate],
    }
  }

  db.DAILYATTENDANCE.findAll({
    where: where,
    raw: true,
    include: [
      // {model: db.EMPLOYEE, as: 'EMPLOYEE'},
   ]

  }).then((data)=>{
    res.status(200).json(data);
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
});

router.delete('/:id', function(req, res) {
  db.DAILYATTENDANCE.destroy({
    where: {
      id: req.params.id,
    },
  }).then((data)=>{
    res.status(200).json({success : "Attendance deleted successfully", status : 200});
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
});

router.post('/', function(req, res) {
  let reqJson = req.body;
  db.DAILYATTENDANCE.create({
    empid	: reqJson.empid,
	firstin	: 	reqJson.firstin,
	lunchout : reqJson.lunchout	,
	lunchin	: reqJson.lunchin,
  finalout : reqJson.finalout	,
  workingtime : reqJson.workingtime	,
  breaktime : reqJson.breaktime	,
  wages:reqJson.wages	,
  }).then((result)=>{
    res.status(200).json(result);
    //res.status(200).json({success : "Attendance added successfully", status : 200});
  }).catch((error)=>{
    res.status(500).json({message: error});
  });
});

router.put('/:id', function(req, res) {
  let reqJson = req.body;
  db.DAILYATTENDANCE.update({
    empid	: reqJson.empid,
	firstin	: 	reqJson.firstin,
	lunchout : reqJson.lunchout	,
	lunchin	: reqJson.lunchin,
  finalout : reqJson.finalout	,
  workingtime : reqJson.workingtime	,
  breaktime : reqJson.breaktime	,
  wages:reqJson.wages	,
  },{
    where: {
      id: reqJson.id,
    },
  }).then(()=>{
    res.status(200).json({success : "Attendance updated Successfully", status : 200});
  }).catch((error)=>{
    res.status(500).json({message: error});
  });
});

module.exports = router;