import { Box, makeStyles } from '@material-ui/core';
import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import { setNotification } from '../store/reducers/notification';
import { getApi } from '../api';
import _ from 'lodash';
import { getSettings, setSettings } from '../store/reducers/settings';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import ToggleButton from '@material-ui/lab/ToggleButton';
import Agents from './Agents';
import TabPanel from '../components/TabPanel';
import Parties from './Parties';
import { CountChart } from './CountChart';

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

function Master(props) {
  const classes = useStyles();
  const [tabvalue, setTabvalue] = React.useState(0);
  const apiObj = useMemo(()=>getApi(), []);
  const licExpired = props.activation.is_trial && props.activation.usage_days_left <= 0;

  const tabChange = (event, newValue) => {
    newValue!=null && setTabvalue(newValue);
  };

  return (
    <Box p={1} display="flex" flexDirection="column" height="100%">
      <ToggleButtonGroup size="small"  exclusive value={tabvalue} exclusive onChange={tabChange}>
        <ToggleButton value={0}>
          Agents
        </ToggleButton>
        <ToggleButton value={1}>
          Parties
        </ToggleButton>
        <ToggleButton value={2}>
          Count chart
        </ToggleButton>
      </ToggleButtonGroup>
      <TabPanel value={tabvalue} index={0}>
        <Agents apiObj={apiObj} licExpired={licExpired}/>
      </TabPanel>
      <TabPanel value={tabvalue} index={1}>
        <Parties apiObj={apiObj} licExpired={licExpired}/>
      </TabPanel>
      <TabPanel value={tabvalue} index={2}>
        <CountChart apiObj={apiObj} licExpired={licExpired}/>
      </TabPanel>
    </Box>
  )
}

export default connect((state)=>({settings: getSettings(state)}), (dispatch)=>({
  setNotification: (...args)=>{dispatch(setNotification.apply(this, args))},
}))(Master);