import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Card, Divider, IconButton, Link, makeStyles, Modal, OutlinedInput, Paper, Typography, useTheme } from '@material-ui/core';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { NOTIFICATION_TYPE, setNotification } from './store/reducers/notification';
import { BASE_URL, getApi } from './api';
import _ from 'lodash';
import { FormInputText, FormRow, FormRowItem } from './components/FormElements';
import { getSettings, setSettings } from './store/reducers/settings';

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

function Settings(props) {
  const classes = useStyles();
  const [openCalc, setOpenCalc] = useState(false);
  const [selId, setSelId] = useState({});
  const [qualities, setQualities] = useState([]);
  const homeRef = useRef();
  const apiObj = useMemo(()=>getApi(), []);
  const licExpired = props.activation.is_trial && props.activation.usage_days_left <= 0;
  const [formData, setFormData] = useState(props.settings);

  useEffect(()=>{
    setFormData(props.settings);
  }, [props.settings]);

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

  const onSave = ()=>{
    apiObj({
      method: 'PUT',
      url: BASE_URL.SETTINGS,
      data: formData,
    }).then((res)=>{
      props.setSettings(formData);
      props.setNotification(NOTIFICATION_TYPE.SUCCESS, 'Settings saved successfully');
    }).catch((err)=>{
      props.setNotification(NOTIFICATION_TYPE.ERROR, getAxiosErr(err));
    });
  }

  return (
    <Box p={1} display="flex" flexDirection="column" height="100%">
      <Box flexGrow={1} overflow="auto">
        <Paper>
          <Typography style={{padding: '0.5rem'}}>Fabric Costing</Typography>
          <Divider />
          <Box p={1}>
            <FormRow>
              <FormRowItem>
                <FormInputText autoFocus label="Length per count" name='length_per_count' value={formData.length_per_count}
                  onChange={onTextChange} type="number"
                  />
              </FormRowItem>
              <FormRowItem></FormRowItem>
              <FormRowItem></FormRowItem>
              <FormRowItem></FormRowItem>
            </FormRow>
          </Box>
        </Paper>
      </Box>
      <Box>
        <Button variant="contained" onClick={onSave} color="primary">Save</Button>
      </Box>
    </Box>
  )
}

export default connect((state)=>({settings: getSettings(state)}), (dispatch)=>({
  setNotification: (...args)=>{dispatch(setNotification.apply(this, args))},
  clearNotification: ()=>{dispatch(setNotification(null, null))},
  setSettings: (payload)=>{dispatch(setSettings(payload))},
}))(Settings);