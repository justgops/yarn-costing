const Sequelize = require('sequelize');
var router = require('express').Router();
const db = require('../db/models');

router.get('/', function(req, res, next) {

  db.USERS.findAll({
    order: [['username', 'ASC']],
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
  db.USERS.findOne({
    order: [['username', 'ASC']],
    raw: true,
  }).then((data)=>{
    res.status(200).json(data);
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
});

router.get('/:id', function(req, res) {
  db.USERS.findOne({
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
  db.USERS.destroy({
    where: {
      id: req.params.id,
    },
  }).then((data)=>{
    res.status(200).json({success : "User deleted successfully", status : 200});
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
});

router.post('/', function(req, res) {
  let reqJson = req.body;
  db.USERS.create({
    username :	reqJson.username,
	firstname	: reqJson.firstname,
	lastname	: reqJson.lastname,
	password	: reqJson.password,
	role	: reqJson.role,
  }).then((result)=>{
    res.status(200).json(result);
    //res.status(200).json({success : "User added successfully", status : 200});
  }).catch((error)=>{
    res.status(500).json({message: error});
  });
});

router.put('/:id', function(req, res) {
  let reqJson = req.body;
  db.USERS.update({
    username :	reqJson.username,
	firstname	: reqJson.firstname,
	lastname	: reqJson.lastname,
	password	: reqJson.password,
	role	: reqJson.role,
  },{
    where: {
      id: reqJson.id,
    },
  }).then(()=>{
    res.status(200).json({success : "User updated Successfully", status : 200});
  }).catch((error)=>{
    res.status(500).json({message: error});
  });
});

module.exports = router;