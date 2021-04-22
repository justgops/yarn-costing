import { AppBar, Box, makeStyles, Snackbar, Toolbar, Typography } from '@material-ui/core';
import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';
import NavButton from './components/NavButton';
import { connect } from 'react-redux';
import Alert from '@material-ui/lab/Alert';
import { NOTIFICATION_TYPE, setNotification } from './store/reducers/notification';
import License from './License';
import {epochDiffDays, getAxiosErr, getEpoch} from './utils';
import { BASE_URL, getApi } from './api';
import FabricCosting from './FabricCosting';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';

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
  {label: 'Fabric costing', path: '/fabriccosting', component: FabricCosting},
  {label: 'License', path: '/license', component: License},
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

const TRIAL_DAYS = 15;

function Dashboard({location, ...props}) {
  const classes = useStyles();
  const api = useMemo(()=>getApi());
  const [activation, setActivation] = useState({
    is_trial: true,
    usage_days_left: 0,
    system_id: null,
  });
  const navSubItems = useMemo(()=>{
    let tmp = []
    navItems.filter((item)=>Boolean(item.submenu)).forEach((item)=>{
      tmp.push(...item.submenu);
    });
    return tmp;
  });

  const onActivate = (activation_date, activation_key)=>{
    setActivation((prev)=>{
      return {
        ...prev,
        is_trial: !Boolean(activation_date),
      }
    });
  }

  useEffect(()=>{
    api.post(BASE_URL.MISC + '/init')
        .then((res)=>{
            let data = res.data;
            console.log(data);
            setActivation((prev)=>{
              let usage_days_left = (TRIAL_DAYS - epochDiffDays(getEpoch(), data.install_date));
              usage_days_left = usage_days_left < 0 ? 0 : usage_days_left;
              return {
                ...prev,
                system_id: data.system_id,
                is_trial: !Boolean(data.activation_date),
                usage_days_left: usage_days_left,
              }
            });
        })
        .catch((err)=>{
            console.log(getAxiosErr(err));
        });
  }, []);


  return(
    <Box className={classes.dashboardRoot}>
      <Box><Toolbar variant="dense"/></Box>
      <AppBar color="default" elevation={1} component="div">
        <Toolbar variant="dense" disableGutters>
          <Box display="flex" style={{padding: '0rem 0.5rem'}} alignItems="center">
            {/* <Logo height="3em" width="3em"/> */}
            <Typography variant="h6" style={{color: '#d94874'}}>
              Costing
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
                <Route key={item.path} exact path={item.path} render={(props)=><item.component {...props} onActivate={onActivate} activation={activation}/>} >
                  {item.redirect && <Redirect to={item.redirect} />}
                </Route>
              );
            })}
            <Route>
              <Redirect to='/FabricCosting' />
            </Route>
          </Switch>
        </Box>
      <Snackbar
        open={Boolean(props.notify.message)}
        autoHideDuration={2500}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        onClose={(event, reason)=>{
          if (reason === 'clickaway') {
            return;
          }
          props.clearNotification();
        }}
      >
        <Alert severity={props.notify.type} onClose={props.clearNotification}>
          {props.notify.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default connect((state)=>({notify: state.notify}), (dispatch)=>({
  setNotification: (...args)=>{dispatch(setNotification.apply(this, args))},
  clearNotification: ()=>{dispatch(setNotification(null, null))},
}))(Dashboard);