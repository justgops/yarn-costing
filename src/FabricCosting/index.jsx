import { Box, Button, IconButton, Link, makeStyles, Modal, OutlinedInput, useTheme } from '@material-ui/core';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { connect } from 'react-redux';
import DataGrid from '../components/DataGrid';
import { NOTIFICATION_TYPE, setNotification } from '../store/reducers/notification';
import Calculator from './Calculator';
import { BASE_URL, getApi } from '../api';
import _ from 'lodash';
import { AddRounded } from '@material-ui/icons';

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

function getAxiosErr(err) {
  let message = '';
  if (err.response) {
    // client received an error response (5xx, 4xx)
    if(_.isString(err.response.data.message)) {
      message = err.response.data.message;
    } else {
      message = err.response.statusText + '. Contact administrator.';
    }
  } else if (err.request) {
    // client never received a response, or request never left
    message = 'Not able to send the request. Contact administrator.';
  } else {
    message = 'Some error occurred. Contact administrator.';
  }
  return message;
}

function FabricCosting(props) {
  const classes = useStyles();
  const [openCalc, setOpenCalc] = useState(false);
  const [selId, setSelId] = useState(null);
  const [qualities, setQualities] = useState([]);
  const homeRef = useRef();
  const apiObj = useMemo(()=>getApi(), []);
  const licExpired = props.activation.is_trial && props.activation.usage_days_left <= 0;

  useEffect(()=>{
    /* load masters */
    apiObj.get(BASE_URL.QUALITIES)
      .then((res)=>{
        setQualities(res.data);
      })
      .catch((err)=>{
        props.setNotification(NOTIFICATION_TYPE.ERROR, getAxiosErr(err));
      });
  }, []);

  const columns = useMemo(()=>[
    {
      Header: '',
      id: 'btn-del',
      width: '30px',
      // Cell: ({value, row})=>{
      //   return <Link onClick={()=>{
      //     if(licExpired) return;
      //     setSelId(row.original.id);
      //     setOpenCalc(true);
      //   }} href="#">{value}</Link>
      // }
    },
    {
      Header: '',
      id: 'btn-edit',
      width: '30px',
      // Cell: ({value, row})=>{
      //   return <Link onClick={()=>{
      //     if(licExpired) return;
      //     setSelId(row.original.id);
      //     setOpenCalc(true);
      //   }} href="#">{value}</Link>
      // }
    },
    {
      Header: 'Name',
      accessor: 'name',
      width: '25%',
      Cell: ({value, row})=>{
        return <Link onClick={()=>{
          if(licExpired) return;
          setSelId(row.original.id);
          setOpenCalc(true);
        }} href="#">{value}</Link>
      }
    },
    {
      Header: 'Agent',
      accessor: 'agentId',
      width: '20%',
      // accessor: (originalRow)=>originalRow.data.notes,
      // Cell: ({value})=><span>{value}</span>,
    },
    {
      Header: 'Party',
      accessor: 'partyId',
      width: '20%',
      // accessor: (originalRow)=>originalRow.data.notes,
      // Cell: ({value})=><span>{value}</span>,
    },{
      Header: 'Notes',
      accessor: 'notes',
      width: '35%',
      Cell: ({value})=><span>{value}</span>,
    },
  ], [licExpired]);

  const [search, setSearch] = useState('');

  const onClose = (otherData)=>{
    if(otherData?.id) {
      setQualities((prevQualities)=>{
        let qIndx = _.findIndex(qualities, (q)=>q.id == otherData.id);
        if(qIndx > 0) {
          return [
            ...prevQualities.slice(0, qIndx),
            otherData,
            ...prevQualities.slice(qIndx+1),
          ];
        } else {
          return [
            ...prevQualities,
            otherData,
          ];
        }
      });
    }
    setOpenCalc(false);
  }

  return (
    <Box>
      <Box className={classes.root} ref={homeRef}>
        <Box className={classes.searchbar}>
          <OutlinedInput value={search} onChange={(e)=>{setSearch(e.target.value)}} style={{minWidth: '20%'}} placeholder="Search quality"/>
          <Button variant="contained" color="primary" onClick={()=>{
              setSelId(null);
              setOpenCalc(true);
            }} style={{marginLeft: '0.5rem'}}
            disabled={licExpired}
            startIcon={<AddRounded />}
          >Add new quality</Button>
        </Box>
        <Box className={classes.gridarea}>
          <DataGrid columns={columns} data={qualities} filterText={search} fixedLayout={true}
            noRowsMessage="Click on add new quality"/>
        </Box>
      </Box>
      <Calculator open={openCalc} onClose={onClose} selId={selId} />
    </Box>
  )
}

export default connect(()=>({}), (dispatch)=>({
  setNotification: (...args)=>{dispatch(setNotification.apply(this, args))},
  clearNotification: ()=>{dispatch(setNotification(null, null))},
}))(FabricCosting);