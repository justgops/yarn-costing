import { Box, Button, IconButton, Link, makeStyles, Modal, OutlinedInput, useTheme } from '@material-ui/core';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { connect } from 'react-redux';
import DataGrid from '../components/DataGrid';
import { NOTIFICATION_TYPE, setNotification } from '../store/reducers/notification';
import Calculator from './Calculator';
import { BASE_URL, getApi } from '../api';
import _ from 'lodash';
import { AddRounded } from '@material-ui/icons';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import ConfirmDialog from '../helpers/ConfirmDialog';
import { FormInputSelectSearch, FormInputText, FormRow, FormRowItem } from '../components/FormElements';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';

const useStyles = makeStyles((theme)=>({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  searchbar: {
    padding: theme.spacing(1),
  },
  gridarea: {
    padding: theme.spacing(0, 1),
    flexGrow: 1,
  },
  expandTd: {
    padding: '8px',
  },
  expandTdTitle: {
    marginBottom: '8px',
    color: theme.palette.secondary.main,
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

function ExpandedRows({apiObj, row, agentOpts, partyOpts}) {
  const classes = useStyles();
  let [exrows, setExrows] = useState(null);
  useEffect(()=>{
    const fetchExrows = async ()=>{
      let res = await apiObj.get(BASE_URL.QUALITY_HIST + '/' + row.original.id);
      setExrows(res.data);
    }
    fetchExrows();
  }, []);
  if(!exrows) {
    return <span>Loading...</span>
  }

  const skipColumns = [
    {
      Header: 'Date',
      accessor: 'date',
      width: '10%',
    },
    {
      Header: 'Name',
      accessor: 'name',
      width: '25%',
    },
    {
      Header: 'EPI/Reed(Inch)',
      accessor: 'dispReed',
      width: '10%',
    },
    {
      Header: 'PPI(Pick)',
      accessor: 'dispPick',
      width: '10%',
    },
    {
      Header: 'Production Cost',
      accessor: 'dispProdCost',
      width: '15%',
    },
    {
      Header: 'Agent',
      accessor: 'agentId',
      width: '20%',
      Cell: ({value})=>{
        return <span>{(_.find(agentOpts, (e)=>e.value==value)||{}).label}</span>;
      },
    },
    {
      Header: 'Party',
      accessor: 'partyId',
      width: '20%',
      Cell: ({value})=>{
        return <span>{(_.find(partyOpts, (e)=>e.value==value)||{}).label}</span>;
      },
    },{
      Header: 'Notes',
      accessor: 'notes',
      width: '35%',
      Cell: ({value})=><span>{value}</span>,
    },
  ]
  return (
    <div colSpan="100%" className={classes.expandTd}>
      <div className={classes.expandTdTitle}>History</div>
      <DataGrid columns={skipColumns} data={exrows} fixedLayout={true} noRowsMessage="No history" />
    </div>
  );
}

function FabricCosting(props) {
  const classes = useStyles();
  const [openCalc, setOpenCalc] = useState(false);
  const [selId, setSelId] = useState(null);
  const [agentOpts, setAgentOpts] = useState([]);
  const [partyOpts, setPartyOpts] = useState([]);
  const [sizingOpts, setSizingOpts] = useState([]);
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

      res = await apiObj.get(BASE_URL.SIZINGS);
      setSizingOpts((res.data || []).map((e)=>({label: e.name, value: e.id})));

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
      id: 'btn-expand',
      width: '30px',
      Cell: ({value, row})=>{
        return <IconButton onClick={()=>{
          row.toggleRowExpanded(!row.isExpanded);
        }} >{row.isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>;
      }
    },
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
      Header: 'EPI/Reed(Inch)',
      accessor: 'dispReed',
      width: '10%',
    },
    {
      Header: 'PPI(Pick)',
      accessor: 'dispPick',
      width: '10%',
    },
    {
      Header: 'Production Cost',
      accessor: 'dispProdCost',
      width: '15%',
    },
    {
      Header: 'Agent',
      accessor: 'agentId',
      width: '20%',
      Cell: ({value})=>{
        return <span>{(_.find(agentOpts, (e)=>e.value==value)||{}).label}</span>;
      },
    },
    {
      Header: 'Party',
      accessor: 'partyId',
      width: '20%',
      Cell: ({value})=>{
        return <span>{(_.find(partyOpts, (e)=>e.value==value)||{}).label}</span>;
      },
    },{
      Header: 'Notes',
      accessor: 'notes',
      width: '35%',
      Cell: ({value})=><span>{value}</span>,
    },
  ], [licExpired, agentOpts, partyOpts]);

  const [filter, setFilter] = useState({});

  const onFilterChange = useCallback((e, name) => {
    let value = e;
    if(e && e.target) {
      name = e.target.name;
      value = e.target.value;
    }

    setFilter((prevData)=>({
      ...prevData,
      [name]: value,
    }));
  });

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
        return prevQualities;
      });
    }).catch((err)=>{
      props.setNotification(NOTIFICATION_TYPE.ERROR, getAxiosErr(err));
    });
  };

  let filterObj = [];
  (filter.text && filter.text.trim() != '') && filterObj.push({
    id: 'name', value: filter.text
  });
  filter.agentId && filterObj.push({
    id: 'agentId', value: filter.agentId
  });
  filter.partyId && filterObj.push({
    id: 'partyId', value: filter.partyId
  });

  return (
    <Box>
      <Box className={classes.root} ref={homeRef}>
        <Box className={classes.searchbar}>
          <FormRow>
            <FormRowItem>
              <FormInputText autoFocus label="Search name" name='text' value={filter.text} onChange={onFilterChange} />
            </FormRowItem>
            <FormRowItem>
              <FormInputSelectSearch label="Agent" name='agentId' options={agentOpts} isClearable={true}
                value={_.find(agentOpts, (e)=>e.value == filter.agentId)}
                onChange={(value)=>{
                  onFilterChange(value?.value, 'agentId');
                }}
              />
            </FormRowItem>
            <FormRowItem>
              <FormInputSelectSearch label="Party" name='partyId' options={partyOpts} isClearable={true}
                value={_.find(partyOpts, (e)=>e.value == filter.partyId)}
                onChange={(value)=>{
                  onFilterChange(value?.value, 'partyId');
                }}
              />
            </FormRowItem>
            <FormRowItem>
            </FormRowItem>
          </FormRow>
          <Box style={{marginTop: '0.5rem'}}>
            <Button variant="contained" color="primary" onClick={()=>{
                setSelId(null);
                setOpenCalc(true);
              }}
              disableElevation
              disabled={licExpired}
              startIcon={<AddRounded />}
            >Add new quality</Button>
          </Box>
        </Box>
        <Box className={classes.gridarea}>
          <DataGrid columns={columns} data={qualities} fixedLayout={true} noRowsMessage="Click on add new quality"
            filterObj={filterObj}
            onExpand={(row)=><ExpandedRows apiObj={apiObj} row={row} columns={columns} agentOpts={agentOpts} partyOpts={partyOpts}/>} />
        </Box>
      </Box>
      <Calculator open={openCalc} onClose={onClose} selId={selId} agentOpts={agentOpts} partyOpts={partyOpts} sizingOpts={sizingOpts}/>
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