module.exports = (port) => {
  var express = require('express');
  var cors = require("cors");
  var path = require('path');
  var bodyParser = require('body-parser')
  var exphbs  = require('express-handlebars');

  app = express();
  // app.set('views', path.resolve(__dirname, 'views', 'pages'));
  app.engine('html', exphbs());
  app.set('view engine', 'html');

  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false }))

  // parse application/json
  app.use(bodyParser.json())
  app.use(cors({ origin: true, credentials: true }));

  /* Routes */
  app.use(express.static(path.resolve(__dirname, 'build')));
  app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
  app.use('/api/qualities', require('./routers/qualities'));
  app.use('/api/misc', require('./routers/misc'));
  app.use('/api/settings', require('./routers/settings'));
  app.use('/api/agents', require('./routers/agents'));
  app.use('/api/parties', require('./routers/parties'));
  app.use('/api/sizings', require('./routers/sizings'));

  app.listen(port || 8787, console.log(`App listening at http://localhost:${port}/app`));
};