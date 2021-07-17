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

function PartyForm({apiObj, selData, onClose, ...props}) {
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
  });

  const onSaveClick = async ()=>{
    setIsSaving(true);
    try {
      if(formData.id) {
        await apiObj.put(BASE_URL.PARTIES + '/' + formData.id, formData);
        onClose(formData);
      } else {
        let res = await apiObj.post(BASE_URL.PARTIES, formData);
        onClose({id: res.data, ...formData});
      }
      props.setNotification(NOTIFICATION_TYPE.SUCCESS, 'Party details saved succesfully');
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

function Parties({apiObj, licExpired, ...props}) {
  const classes = useStyles();
  const [parties, setParties] = useState([]);
  const [search, setSearch] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [selData, setSelData] = useState(null);
  useEffect(async ()=>{
    try {
      let res = await apiObj.get(BASE_URL.PARTIES);
      setParties(res.data);
    } catch (error) {
      props.setNotification(NOTIFICATION_TYPE.ERROR, getAxiosErr(error));
    }
  }, []);

  const onClose = (formData)=>{
    setOpenForm(false);
    if(formData?.id) {
      setParties((prevParties)=>{
        let indx = _.findIndex(prevParties, (e)=>e.id == formData.id);
        if(indx >= 0) {
          return [
            ...prevParties.slice(0, indx),
            formData,
            ...prevParties.slice(indx+1),
          ];
        } else {
          return [
            ...prevParties,
            formData,
          ];
        }
      });
    }
  }
  const columns = useMemo(()=>[
    {
      Header: 'Party Name',
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
        <OutlinedInput value={search} onChange={(e)=>{setSearch(e.target.value)}} style={{minWidth: '20%'}} placeholder="Search party"/>
        <Button variant="contained" color="primary" onClick={()=>{
            setSelData(null);
            setOpenForm(true);
          }} style={{marginLeft: '0.5rem'}}
          disabled={licExpired}
          startIcon={<AddRounded />}
        >Add new party</Button>
      </Box>
      <Box className={classes.gridarea}>
        <DataGrid columns={columns} data={parties} filterText={search} fixedLayout={true}
          noRowsMessage="Click on add new party"/>
      </Box>
      <PartyForm apiObj={apiObj} title={selData?.id ? 'Update Party' : 'Add Party'} open={openForm} onClose={onClose}
        selData={selData} setNotification={props.setNotification}/>
    </Box>
  );
}

export default connect((state)=>({settings: getSettings(state)}), (dispatch)=>({
  setNotification: (...args)=>{dispatch(setNotification.apply(this, args))},
}))(Parties);