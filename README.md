# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

Creating mirgations is easy: https://sequelize.org/v5/manual/migrations.html

npx sequelize-cli model:generate --name Qualities --attributes name:string,notes:string,data:string
npx sequelize-cli model:generate --name Misc --attributes last_opened_enc:string,install_date_enc:string,system_id:string,expiry_date_enc:string,activation_date_enc:string

npx sequelize-cli model:generate --name Settings --attributes value:string

npx sequelize-cli model:generate --name MASTER_COMPANY --attributes companyname:string,companyshortname:string,addressline:string,addressline1:string,city:string,state:string,pincode:string

npx sequelize-cli model:generate --name MASTER_WORKROLE --attributes roletype:string,shifthours:real,rolewages:real,sort_priority:integer,desc:string

npx sequelize-cli model:generate --name MASTER_WAGETYPE --attributes wagetype:string,desc:string,unit:string

npx sequelize-cli model:generate --name MASTER_PMTTYPE --attributes pmttype:string,desc:string

npx sequelize-cli model:generate --name MASTER_EMPLOYEE --attributes firstname:string,lastname:string,startdate:date,enddate:date,phonenumber:string

npx sequelize-cli model:generate --name DAILYATTENDANCE --attributes empid:integer,firstin:date,lunchout:date,lunchin:date,finalout:date,workingtime:real,breaktime:real

npx sequelize-cli model:generate --name DAILYWAGES --attributes empid:integer,wagedate:date,wages:real

npx sequelize-cli model:generate --name TRASNACTION --attributes empid:integer,pmttypeid:integer,compid:integer,transdate:date,amount:real,desc:string

/** Seeders **/ npx sequelize-cli seed:generate --name default-users npx sequelize-cli seed:generate --name default-wagetype
npx sequelize-cli seed:generate --name default-settings
npx sequelize-cli seed:generate --name add-default-settings