import { AppBar, Box, makeStyles, Snackbar, Toolbar, Typography } from '@material-ui/core';
import React, { useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';
import NavButton from './components/NavButton';
import { connect } from 'react-redux';
import Alert from '@material-ui/lab/Alert';
import { NOTIFICATION_TYPE, setNotification } from './store/reducers/notification';
import About from './About';
import axios from 'axios';
import { BASE_URL } from './api';
import Home from './Home';
import { setQualities } from './store/reducers/qualities';
import Calculator from './Calculator';

const useStyles = makeStyles((theme)=>({
  dashboardRoot: {
    display: 'flex',
    height: '100%',
    flexDirection: 'column',
  },
  subMenu: {
    top: '42px',
  },
  bottomMenuContent: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  rightContent: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
}));

const navItems = [
  {label: 'Home', path: '/home', component: Home},
  {label: 'About', path: '/about', component: About},
];

function NavBar({navItems}) {
  return <Box>
    {navItems.map((item)=>{
      return <NavButton key={item.path} path={item.path}>{item.label}</NavButton>;
    })}
  </Box>
}

function SubMenu({item}) {
  const classes = useStyles();
  let match = useRouteMatch({
    path: item.path,
  });
  if(match) {
    return (
      <>
      <Box><Toolbar variant="dense"/></Box>
      <AppBar color="default" elevation={1} component="div" className={classes.subMenu}>
        <Toolbar variant="dense">
          <NavBar navItems={item.submenu} />
        </Toolbar>
      </AppBar>
      </>
    );
  } else {
    return <></>
  }
}

function Dashboard({location, ...props}) {
  const classes = useStyles();
  const navSubItems = useMemo(()=>{
    let tmp = []
    navItems.filter((item)=>Boolean(item.submenu)).forEach((item)=>{
      tmp.push(...item.submenu);
    });
    return tmp;
  });

  useEffect(()=>{
    /* load masters */
    async function fetchQualities() {
      try {
        // let res = await axios.get(BASE_URL.EMPLOYEE);
        let res = {
          data: [{
            'id': 1,
            'name': 'aditya',
            'notes': 'the best quality'
          },{
            'id': 2,
            'name': 'aditya tosh',
            'notes': 'the best quality'
          },{
            'id': 2,
            'name': 'aditya tosh',
            'notes': 'the best quality'
          },{
            'id': 2,
            'name': 'aditya tosh',
            'notes': 'the best quality'
          },{
            'id': 2,
            'name': 'aditya tosh',
            'notes': 'the best quality'
          },{
            'id': 2,
            'name': 'aditya tosh',
            'notes': 'the best quality'
          },{
            'id': 2,
            'name': 'aditya tosh',
            'notes': 'the best quality'
          },{
            'id': 2,
            'name': 'aditya tosh',
            'notes': 'the best quality'
          }]
        };
        props.setQualities(res.data);
      } catch(err) {
        props.setNotification(NOTIFICATION_TYPE.ERROR, err);
      }
    }
    fetchQualities();
  }, []);
  return(
    <Box className={classes.dashboardRoot}>
      <Box><Toolbar variant="dense"/></Box>
      <AppBar color="default" elevation={1} component="div">
        <Toolbar variant="dense" disableGutters>
          <Box display="flex" style={{padding: '0rem 0.5rem'}} alignItems="center">
            {/* <Logo height="3em" width="3em"/> */}
            <Typography variant="h6" style={{color: '#d94874'}}>
              Costing Calc
            </Typography>
          </Box>
          <NavBar navItems={navItems} />
        </Toolbar>
      </AppBar>
      {navItems.filter((item)=>Boolean(item.submenu)).map((item)=>{
        return <SubMenu item={item}/>
      })}
        <Box className={classes.bottomMenuContent}>
          <Switch>
            {[...navItems, ...navSubItems].map((item)=>{
              return (
                <Route key={item.path} exact path={item.path} component={item.component}>
                  {item.redirect && <Redirect to={item.redirect} />}
                </Route>
              );
            })}
            <Route>
              <Redirect to='/home' />
            </Route>
          </Switch>
        </Box>
      <Snackbar
        open={Boolean(props.notify.message)}
        autoHideDuration={2500}
        onClose={(event, reason)=>{
          if (reason === 'clickaway') {
            return;
          }
          props.clearNotification();
        }}
      >
        <Alert severity={props.notify.type}>
          {props.notify.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default connect((state)=>({notify: state.notify}), (dispatch)=>({
  setNotification: (...args)=>{dispatch(setNotification.apply(this, args))},
  clearNotification: ()=>{dispatch(setNotification(null, null))},
  setQualities: (payload)=>{dispatch(setQualities(payload))},
}))(Dashboard);