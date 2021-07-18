import { Box, Button, IconButton, Link, makeStyles, OutlinedInput } from '@material-ui/core';
import { AddRounded } from '@material-ui/icons';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { BASE_URL } from '../api';
import DataGrid from '../components/DataGrid';
import { FormInputText } from '../components/FormElements';
import CommonDialog from '../helpers/CommonDialog';
import { NOTIFICATION_TYPE, setNotification } from '../store/reducers/notification';
import { getSettings } from '../store/reducers/settings';
import { getAxiosErr } from '../utils';

const useStyles = makeStyles((theme)=>({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  searchbar: {
    display: 'flex',
    padding: theme.spacing(1, 0),
  },
  gridarea: {
    flexGrow: 1,
  }
}));

function AgentForm({apiObj, selData, onClose, ...props}) {
  const defaults = {
    name: '',
  }
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const editMode = Boolean(selData?.id);

  useEffect(()=>{
    if(props.open) {
      setIsSaving(false);
      setFormData(editMode ? selData : defaults);
    }
  }, [props.open]);

  const onTextChange = useCallback((e, name) => {
    let value = e;
    if(e && e.target) {
      name = e.target.name;
      value = e.target.value;
    }

    setFormData((prevData)=>({
      ...prevData,
      [name]: value,
    }));
  }, []);

  const onSaveClick = async ()=>{
    setIsSaving(true);
    try {
      if(formData.id) {
        await apiObj.put(BASE_URL.AGENTS + '/' + formData.id, formData);
        onClose(formData);
      } else {
        let res = await apiObj.post(BASE_URL.AGENTS, formData);
        onClose({id: res.data, ...formData});
      }
      props.setNotification(NOTIFICATION_TYPE.SUCCESS, 'Agent details saved succesfully');
    } catch (error) {
      props.setNotification(NOTIFICATION_TYPE.ERROR, getAxiosErr(error));
    }
    setIsSaving(false);
  };

  return (
    <CommonDialog onSave={onSaveClick} isSaving={isSaving} onClose={()=>onClose()} {...props}>
      <FormInputText name="name" type="text" label="Party Name" value={formData.name}
        onChange={onTextChange} autoFocus/>
    </CommonDialog>
  );
}

function Agents({apiObj, licExpired, ...props}) {
  const classes = useStyles();
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [selData, setSelData] = useState(null);
  useEffect(async ()=>{
    try {
      let res = await apiObj.get(BASE_URL.AGENTS);
      setAgents(res.data);
    } catch (error) {
      props.setNotification(NOTIFICATION_TYPE.ERROR, getAxiosErr(error));
    }
  }, []);

  const onClose = (formData)=>{
    setOpenForm(false);
    if(formData?.id) {
      setAgents((prevAgents)=>{
        let indx = _.findIndex(prevAgents, (e)=>e.id == formData.id);
        if(indx >= 0) {
          return [
            ...prevAgents.slice(0, indx),
            formData,
            ...prevAgents.slice(indx+1),
          ];
        } else {
          return [
            ...prevAgents,
            formData,
          ];
        }
      });
    }
  }
  const columns = useMemo(()=>[
    {
      Header: 'Agent Name',
      accessor: 'name',
      width: '100%',
      Cell: ({value, row})=>{
        return <Link onClick={()=>{
          if(licExpired) return;
          setSelData(row.original);
          setOpenForm(true);
        }} href="#">{value}</Link>
      }
    }
  ], [licExpired]);
  return (
    <Box className={classes.root}>
      <Box className={classes.searchbar}>
        <OutlinedInput value={search} onChange={(e)=>{setSearch(e.target.value)}} style={{minWidth: '20%'}} placeholder="Search agent"/>
        <Button variant="contained" color="primary" onClick={()=>{
            setSelData(null);
            setOpenForm(true);
          }} style={{marginLeft: '0.5rem'}}
          disabled={licExpired}
          startIcon={<AddRounded />}
        >Add new agent</Button>
      </Box>
      <Box className={classes.gridarea}>
        <DataGrid columns={columns} data={agents} filterText={search} fixedLayout={true}
          noRowsMessage="Click on add new agent"/>
      </Box>
      <AgentForm apiObj={apiObj} title={selData?.id ? 'Update Party' : 'Add Party'} open={openForm} onClose={onClose}
        selData={selData} setNotification={props.setNotification}/>
    </Box>
  );
}

export default connect((state)=>({settings: getSettings(state)}), (dispatch)=>({
  setNotification: (...args)=>{dispatch(setNotification.apply(this, args))},
}))(Agents);