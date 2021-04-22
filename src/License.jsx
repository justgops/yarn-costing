import { Box, Button, Divider, Link, Paper, Typography } from '@material-ui/core';
import React, { useCallback, useMemo, useState } from 'react';
import { FormInputText, FormRow, FormRowItem } from './components/FormElements';
import {epochDiffDays, getAxiosErr, getEpoch} from './utils';
import { BASE_URL, getApi } from './api';
import { NOTIFICATION_TYPE, setNotification } from './store/reducers/notification';
import { connect } from 'react-redux';

function License({activation, onActivate, ...props}) {
  const [activationid, setActivationid] = useState('');
  const api = useMemo(()=>getApi());
  const onKeyChange = useCallback((e)=>{
    setActivationid(e.target.value);
  });

  const onActivateClick = useCallback(()=>{
    api.post(BASE_URL.MISC + '/activate', {
      activation_key: activationid,
    })
    .then((res)=>{
      let data = res.data;
      props.setNotification(NOTIFICATION_TYPE.SUCCESS, 'Product activated to full version !!');
      onActivate(data.activation_date, activationid);
    })
    .catch((err)=>{
      props.setNotification(NOTIFICATION_TYPE.ERROR, getAxiosErr(err));
    });
  });

  return (
  <Box style={{padding: '0.5rem'}}>
    <Typography>
      <Typography>This software is made by team at <Typography component="span" color="primary" style={{fontWeight: "bold"}}>Yantra</Typography> with a lot of R&D and user feedbacks. We believe that a software should be very easy to use and should not be boring.</Typography>
      <Typography>If you want a custom software for your needs and do not want to use the same old crap, then mail us at <Link href = "mailto: yantra.contact@gmail.com">yantra.contact@gmail.com</Link></Typography>
      <Typography>We'll reach out soon !!</Typography>
    </Typography>
    <Divider style={{margin: '0.5rem'}} />
    {activation.is_trial &&
    <>
    <Typography variant="h5" color="error">
      {activation.usage_days_left > 0 ?
        <span>You're using the trial version. Remaining days for the trial are {activation.usage_days_left} days only.</span>:
        <span>You're trial is expired. Share the system id and get the activation key to activate full version.</span>}
    </Typography>
    <FormRow>
      <FormRowItem>
        <FormInputText label="System ID" value={activation.system_id} readOnly></FormInputText>
      </FormRowItem>
      <FormRowItem></FormRowItem>
    </FormRow>
    <FormRow>
      <FormRowItem>
        <FormInputText label="Activation key (Contact team Yantra)" onChange={onKeyChange} value={activationid}></FormInputText>
      </FormRowItem>
      <FormRowItem></FormRowItem>
    </FormRow>
    <FormRow>
      <FormRowItem>
        <Button variant="contained" color="primary" onClick={onActivateClick}>Activate</Button>
      </FormRowItem>
      <FormRowItem></FormRowItem>
    </FormRow>
    </>
    }
    {!activation.is_trial &&
    <>
    <Typography variant="h5" color="error">
      You are running full license software. Thank you for choosing us.
    </Typography>
    </>
    }
  </Box>
  );
}

export default connect(()=>({}), (dispatch)=>({
  setNotification: (...args)=>{dispatch(setNotification.apply(this, args))},
  clearNotification: ()=>{dispatch(setNotification(null, null))},
}))(License);