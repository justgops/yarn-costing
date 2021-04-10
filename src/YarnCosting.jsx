import { Box, Button, IconButton, Link, makeStyles, Modal, OutlinedInput, useTheme } from '@material-ui/core';
import React, { useMemo, useRef, useState } from 'react';
import { connect } from 'react-redux';
import DataGrid from './DataGrid';
import { NOTIFICATION_TYPE, setNotification } from './store/reducers/notification';
import { useRouteMatch, Link as RouteLink, withRouter } from 'react-router-dom';
import Calculator from './Calculator';
import FileCopyOutlinedIcon from '@material-ui/icons/FileCopyOutlined';
import axios from 'axios';
import { BASE_URL } from './api';

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

function YarnCosting({qualities, onQualityClick}) {
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

  const onSave = (isNew, data)=>{
    console.log(isNew, data);
    let method = '', url;
    // if(isNew) {
    //   method = isNew ? 'POST' : 'PUT';
    //   url = BASE_URL.QUALITIES,
    // }
    axios({
      method: method,
      url: BASE_URL.QUALITIES,
      data: data,
    }).then(()=>{
      setOpenCalc(false);
      setNotification(NOTIFICATION_TYPE.SUCCESS, 'Quality saved successfully');
    }).catch(()=>{
      setNotification(NOTIFICATION_TYPE.ERROR, 'Save failure');
    })
  }

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
      <Calculator open={openCalc} onClose={()=>setOpenCalc(false)} onSave={onSave} data={selId} />
    </Box>
  )
}

export default connect((state)=>({
  qualities: state.qualities
}), (dispatch)=>({
  setNotification: (...args)=>{dispatch(setNotification.apply(this, args))},
  clearNotification: ()=>{dispatch(setNotification(null, null))},
}))(YarnCosting);