import { Box, Button, IconButton, Link, makeStyles, Modal, OutlinedInput, useTheme } from '@material-ui/core';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { connect } from 'react-redux';
import DataGrid from '../components/DataGrid';
import { NOTIFICATION_TYPE, setNotification } from '../store/reducers/notification';
import Calculator from './Calculator';
import { BASE_URL, getApi } from '../api';
import _ from 'lodash';
import { AddRounded } from '@material-ui/icons';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import ConfirmDialog from '../helpers/ConfirmDialog';

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
    padding: theme.spacing(1),
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
  const [agentOpts, setAgentOpts] = useState([]);
  const [partyOpts, setPartyOpts] = useState([]);
  const [qualities, setQualities] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const homeRef = useRef();
  const apiObj = useMemo(()=>getApi(), []);
  const licExpired = props.activation.is_trial && props.activation.usage_days_left <= 0;

  useEffect(async ()=>{
    try {
      let res = await apiObj.get(BASE_URL.AGENTS);
      setAgentOpts((res.data || []).map((e)=>({label: e.name, value: e.id})));

      res = await apiObj.get(BASE_URL.PARTIES);
      setPartyOpts((res.data || []).map((e)=>({label: e.name, value: e.id})));

      /* load masters */
      res = await apiObj.get(BASE_URL.QUALITIES);
      setQualities(res.data);
    } catch (error) {
      props.setNotification(NOTIFICATION_TYPE.ERROR, getAxiosErr(error));
    }
  }, []);

  const columns = useMemo(()=>[
    {
      Header: '',
      id: 'btn-del',
      width: '30px',
      Cell: ({value, row})=>{
        return <IconButton onClick={()=>{
          setSelId(row.original.id);
          setConfirmOpen(true);
        }} ><DeleteForeverIcon /></IconButton>;
      }
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
      width: '20%',
      accessor: (originalRow)=>{
        return (_.find(agentOpts, (e)=>e.value==originalRow.agentId)||{}).label;
      },
    },
    {
      Header: 'Party',
      accessor: 'partyId',
      width: '20%',
      accessor: (originalRow)=>{
        return (_.find(partyOpts, (e)=>e.value==originalRow.partyId)||{}).label;
      },
    },{
      Header: 'Notes',
      accessor: 'notes',
      width: '35%',
      Cell: ({value})=><span>{value}</span>,
    },
  ], [licExpired, agentOpts, partyOpts]);

  const [search, setSearch] = useState('');

  const onClose = (otherData)=>{
    if(otherData?.id) {
      setQualities((prevQualities)=>{
        let qIndx = _.findIndex(qualities, (q)=>q.id == otherData.id);
        if(qIndx >= 0) {
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

  const deleteQuality = (id)=>{
    apiObj.delete(
      BASE_URL.QUALITIES + '/' + id
    ).then(()=>{
      props.setNotification(NOTIFICATION_TYPE.SUCCESS, 'Quality delete successfully');
      setQualities((prevQualities)=>{
        let qIndx = _.findIndex(qualities, (q)=>q.id == id);
        if(qIndx > 0) {
          return [
            ...prevQualities.slice(0, qIndx),
            ...prevQualities.slice(qIndx+1),
          ];
        }
      });
    }).catch((err)=>{
      props.setNotification(NOTIFICATION_TYPE.ERROR, getAxiosErr(err));
    });
  };

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
      <Calculator open={openCalc} onClose={onClose} selId={selId} agentOpts={agentOpts} partyOpts={partyOpts}/>
      <ConfirmDialog
        open={confirmOpen}
        onClose={()=>setConfirmOpen(false)}
        title={"Delete ?"}
        content={"Are you sure you want to delete this quality ?"}
        onConfirm={()=>{
          deleteQuality(selId);
          setConfirmOpen(false);
        }}
      />
    </Box>
  )
}

export default connect(()=>({}), (dispatch)=>({
  setNotification: (...args)=>{dispatch(setNotification.apply(this, args))},
  clearNotification: ()=>{dispatch(setNotification(null, null))},
}))(FabricCosting);