import { Box, Button, Link, makeStyles, Modal, OutlinedInput, useTheme } from '@material-ui/core';
import React, { useMemo, useRef, useState } from 'react';
import { connect } from 'react-redux';
import DataGrid from './DataGrid';
import { setNotification } from './store/reducers/notification';
import { useRouteMatch, Link as RouteLink, withRouter } from 'react-router-dom';
import Calculator from './Calculator';

const QualityLink = withRouter(({path, ...props}) => {
  let theme = useTheme();
  let {children, ...otherProps} = props;
  let match = useRouteMatch({
    path: path,
  });
  return <Link style={{fontSize: theme.typography.fontSize*1.1}}
    component={RouteLink} to={path} {...otherProps} color={match ? "primary" : "default"}
    disableTouchRipple>{children}</Link>;
});

const useStyles = makeStyles((theme)=>({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  searchbar: {
    padding: theme.spacing(1),
    display: 'flex',
  },
  gridarea: {
    flexGrow: 1,
  }
}));

function Home({qualities, onQualityClick}) {
  const classes = useStyles();
  const [openCalc, setOpenCalc] = useState(false);
  const [selId, setSelId] = useState({});
  const homeRef = useRef();
  const columns = useMemo(()=>[
    {
      Header: 'Name',
      accessor: 'name',
      Cell: ({value, row})=>{
        return <Link onClick={()=>{
          setSelId(row.original);
          setOpenCalc(true);
        }} href="#">{value}</Link>
      }
    },
    {
      Header: 'Notes',
      accessor: 'notes',
    },
  ], []);

  const [search, setSearch] = useState('');

  return (
    <Box>
      <Box className={classes.root} ref={homeRef}>
        <Box className={classes.searchbar}>
          <OutlinedInput value={search} onChange={(e)=>{setSearch(e.target.value)}} style={{minWidth: '20%'}} placeholder="Search quality"/>
          <Button variant="contained" color="primary" onClick={()=>{
            setSelId(null);
            setOpenCalc(true);
          }} style={{marginLeft: '0.5rem'}}>Add new</Button>
        </Box>
        <Box className={classes.gridarea}>
          <DataGrid columns={columns} data={qualities} filterText={search}/>
        </Box>
      </Box>
      <Calculator open={openCalc} onClose={()=>setOpenCalc(false)} data={selId} />
    </Box>
  )
}

export default connect((state)=>({
  qualities: state.qualities
}), (dispatch)=>({
  setNotification: (...args)=>{dispatch(setNotification.apply(this, args))},
  clearNotification: ()=>{dispatch(setNotification(null, null))},
}))(Home);