const Sequelize = require('sequelize');
var router = require('express').Router();
const db = require('../db/models');

router.get('/', function(req, res, next) {console.log(req.query);
  let where = {}
  if(req.query.companyname) {
    where['companyname'] = req.query.companyname;
  }
  db.COMPANY.findAll({
    order: [['companyname', 'ASC']],
    raw: true,
    where: where,
  }).then((data)=>{
    res.status(200).json(data);
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    next(err);
  });
});

router.get('/default', function(req, res) {
  db.COMPANY.findOne({
    order: [['companyname', 'ASC']],
    raw: true,
  }).then((data)=>{
    res.status(200).json(data);
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
});

router.get('/:id', function(req, res) {
  db.COMPANY.findOne({
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
  db.COMPANY.destroy({
    where: {
      id: req.params.id,
    },
  }).then((data)=>{
    res.status(200).json({success : "Company deleted successfully", status : 200});
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
});

router.post('/', function(req, res) {
  let reqJson = req.body;
  db.COMPANY.create({
    companyname : reqJson.companyname,
    companyshortname : reqJson.companyshortname,
    addressline : reqJson.addressline,
    addressline1 : reqJson.addressline1,
    city : reqJson.city,
    state : reqJson.state,
    pincode: reqJson.pincode,
  }).then((result)=>{
    res.status(200).json(result);
  }).catch((error)=>{
    res.status(500).json({message: error});
  });
});

router.put('/:id', function(req, res) {
  let reqJson = req.body;
  db.COMPANY.update({
    companyname : reqJson.companyname,
    companyshortname : reqJson.companyshortname,
    addressline : reqJson.addressline,
    addressline1 : reqJson.addressline1,
    city : reqJson.city,
    state : reqJson.state,
    pincode: reqJson.pincode,
  },{
    where: {
      id: reqJson.id,
    },
  }).then(()=>{
    res.status(200).json({success : "Company updated Successfully", status : 200});
  }).catch((error)=>{
    res.status(500).json({message: error});
  });
});

module.exports = router;