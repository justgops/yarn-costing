var router = require('express').Router();
const db = require('../db/models');

router.get('/', function(req, res, next) {
  db.Sizings.findAll({
    raw: true,
  }).then((data)=>{
    res.status(200).json(data);
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    next(err);
  });
});

router.delete('/:id', function(req, res) {
  db.Sizings.destroy({
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
  db.Sizings.create({
    name: reqJson.name,
  }).then((result)=>{
    res.status(200).json(result.id);
  }).catch((error)=>{
    res.status(500).json({message: error});
  });
});

router.put('/:id', function(req, res) {
  let reqJson = req.body;
  db.Sizings.update({
    name: reqJson.name,
  },{
    where: {
      id: req.params.id,
    },
  }).then((data)=>{
    res.status(200).json(data);
  }).catch((error)=>{
    res.status(500).json({message: error});
  });
});

router.get('/set/:id', function(req, res, next) {
  db.SizingSets.findAll({
    raw: true,
    where: {
      qid: req.params.id,
    }
  }).then((data)=>{
    res.status(200).json(data);
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    next(err);
  });
});

router.post('/set', function(req, res) {
  let reqJson = req.body;
  db.SizingSets.create({
    setNo: reqJson.setNo,
    sizingId: reqJson.sizingId,
    qid: reqJson.qid,
    name: reqJson.name,
    data: JSON.stringify(reqJson.data),
  }).then((result)=>{
    res.status(200).json(result.id);
  }).catch((error)=>{
    res.status(500).json({message: error});
  });
});


module.exports = router;