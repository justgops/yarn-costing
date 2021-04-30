import { Box, Button, Card, CardContent, CardHeader, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton, makeStyles, OutlinedInput, Paper, Slide, Typography, useTheme } from '@material-ui/core';
import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { connect } from 'react-redux';
import DataGrid from '../components/DataGrid';
import { setNotification } from '../store/reducers/notification';
import _ from 'lodash';
import { FormRowItem, FormInputText, FormRow } from '../components/FormElements';
import DeleteForeverRoundedIcon from '@material-ui/icons/DeleteForeverRounded';
import CloseOutlinedIcon from '@material-ui/icons/CloseOutlined';

const ROUND_DECIMAL = 3;

function parse(num) {
  if(!isNaN(num)) {
    num = Math.round(num + "e" + ROUND_DECIMAL);
    return Number(num + "e" + -ROUND_DECIMAL);
  } else {
    return Number(0.0);
  }
}

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
  },
  inputGridTd: {
    padding: '0px',
  },
  gridCell: {
    '&:not(.Mui-focused)': {
      '& .MuiOutlinedInput-notchedOutline': {
        border: 0,
      }
    }
  }
}));

const formReducer = (state, action)=>{
  let newState = _.cloneDeep(state);
  let rows = null;
  switch(action.type) {
    case 'init':
      newState = action.value;
      break;
    case 'set_value':
      _.set(newState, action.path, action.value);
      if(action.postReducer) {
        newState = action.postReducer(newState);
      }
      break;
    case 'add_grid_row':
      rows = _.get(newState, action.path, []);
      rows.push(action.value);
      _.set(newState, action.path, rows);
      if(action.postReducer) {
        newState = action.postReducer(newState, true);
      }
      break;
    case 'remove_grid_row':
      rows = _.get(newState, action.path, []);
      rows.splice(action.value, 1);
      _.set(newState, action.path, rows);
      if(action.postReducer) {
        newState = action.postReducer(newState, true);
      }
      break;
  }

  newState = globalReducer(newState);
  newState = rateReducer(newState);
  return newState;
}

const globalReducer = (state)=>{
  state.actual_cost = 0;
  state.total_weight = parse(state.warp_weight + state.weft_weight);
  state.total_weight_wastage = parse(state.warp_weight_wastage + state.weft_weight_wastage);

  for(let row of state['warps'] || []) {
    state.actual_cost  += row.cost + row.sizing_cost;
  }
  for(let row of state['wefts'] || []) {
    state.actual_cost  += row.cost;
  }
  state.actual_cost += state.weaving_charges;
  state.actual_cost = parse(state.actual_cost);
  return state;
}

const warpPostReducer = (state, rowsChange=false)=>{
  state.warp_total_ends =  parse(state.warp_reed) * (parse(state.warp_panna) + parse(state.warp_reed_space));
  state.warp_weight = 0.0;
  state.warp_weight_wastage = 0.0;

  let gridValue = state['warps'];
  if(!gridValue) return state;

  let perct = (100/gridValue.length);

  for(let row of gridValue) {
    row.perct = rowsChange ? perct : row.perct;
    let weight =
      parse((state.warp_total_ends * parse(state.warp_meter)/1693.33/parse(row.count)/parse(state.warp_ltol))
        * parse(row.perct)/100);

    row.weight_wastage = parse(weight + (parse(row.wastage) * weight)/100);
    state.warp_weight += weight;
    state.warp_weight_wastage += row.weight_wastage;

    row.cost = parse(row.weight_wastage * parse(row.rate));
    row.sizing_cost = parse(row.weight_wastage * parse(row.sizing_rate));
  }

  state.warp_weight = parse(state.warp_weight);
  state.warp_weight_wastage = parse(state.warp_weight_wastage);

  return state;
}

const weftPostReducer = (state, rowsChange)=>{
  state.weaving_charges = parse(state.weft_pick) * parse(state.weft_job_rate)/100;
  state.weft_weight = 0;
  state.weft_weight_wastage = 0;

  let gridValue = state['wefts'];
  if(!gridValue) return state;

  let perct = (100/gridValue.length);
  for(let row of gridValue) {
    row.perct = rowsChange ? perct : row.perct;
    let weight =
      parse((parse(state.weft_metre) * (parse(state.weft_panna) + parse(state.weft_reed_space)) * parse(state.weft_pick)/(1693.33*row.count))
        *parse(row.perct)/100);

    row.weight_wastage = parse(weight + (parse(row.wastage) * weight)/100);
    state.weft_weight += weight;
    state.weft_weight_wastage += row.weight_wastage;

    row.cost = parse(row.weight_wastage * parse(row.rate));
  }

  return state;
}

const rateReducer = (state)=>{
  state.rate_out_rs = parse(state.actual_cost + state.actual_cost * parse(state.rate_out_per)/100);
  state.rate_local_rs = parse(state.actual_cost + state.actual_cost * parse(state.rate_local_per)/100);

  state.profit_out_per = parse((parse(state.dem_rate_out_rs) - state.actual_cost)/state.actual_cost*100);
  state.profit_local_per = parse((parse(state.dem_rate_local_rs) - state.actual_cost)/state.actual_cost*100);

  state.job_rate_out = parse((
    (parse(state.dem_rate_out_rs)*100/(100+parse(state.rate_out_per)))-state.actual_cost+state.weaving_charges
  )/parse(state.weft_pick)*100);
  state.job_rate_local = parse((
    (parse(state.dem_rate_local_rs)*100/(100+parse(state.rate_local_per)))-state.actual_cost+state.weaving_charges
  )/parse(state.weft_pick)*100);

  return state;
}


function getGridCols(basePath, formDispatch, postReducer, otherCols, cellClassName) {
  let baseCols = [{
    Header: '',
    id: 'id',
    Cell: ({row})=>{
      return <span style={{paddingLeft: '0.25rem', paddingRight: '0.25rem', fontWeight: 'bold'}}>{row.index+1}</span>;
    }
  },
  {
    Header: '',
    id: 'btn-del',
    Cell: ({row})=>{
      return <IconButton onClick={(e)=>{
        e.preventDefault();
        formDispatch({
          type: 'remove_grid_row',
          path: basePath,
          value: row.index,
          postReducer: postReducer,
        });
      }}><DeleteForeverRoundedIcon /></IconButton>
    }
  }];

  for(const col of otherCols) {
    baseCols.push({
      Header: col.Header,
      accessor: col.accessor,
      Footer: col.showTotal ? (info)=>{
        let total = info.rows.reduce((sum, row) => {
            return (row.values[col.accessor] || 0) + sum
          }, 0
        );
        total = parse(total);
        return <OutlinedInput fullWidth inputProps={{style: {fontWeight: 'bold'}}} className={cellClassName} value={total} type="number" readOnly={true} />
      } : '',
      Cell: ({value, row, column})=>{
        return <OutlinedInput fullWidth className={cellClassName} type="number" value={value} readOnly={col.readOnly} onChange={(e)=>{
          let value = e.target.value;
          formDispatch({
            type: 'set_value',
            path: basePath.concat([row.index, column.id]),
            value: value,
            postReducer: postReducer,
          });
        }} />
      }
    });
  }

  return baseCols;
}

function Calculator({open, onClose, onSave, data}) {
  const classes = useStyles();
  const editMode = !_.isNull(data) && !_.isUndefined(data);
  const [formData, formDispatch] = useReducer(formReducer, data);
  const [formDataErr, setFormDataErr] = useState({});

  useEffect(()=>{
    formDispatch({
      type: 'init',
      value: data || {
        weft_metre: 1,
      },
    });
  }, [data]);

  const onTextChange = useCallback((e, name) => {
    let value = e;
    if(e && e.target) {
      name = e.target.name;
      value = e.target.value;
    }

    formDispatch({
      type: 'set_value',
      path: name,
      value: value,
    });
  });

  const onWarpTextChange = useCallback((e, name) => {
    let value = e;
    if(e && e.target) {
      name = e.target.name;
      value = e.target.value;
    }

    formDispatch({
      type: 'set_value',
      path: name,
      value: value,
      postReducer: warpPostReducer,
    });
  });

  const onWeftTextChange = useCallback((e, name) => {
    let value = e;
    if(e && e.target) {
      name = e.target.name;
      value = e.target.value;
    }
    formDispatch({
      type: 'set_value',
      path: name,
      value: value,
      postReducer: weftPostReducer,
    });
  });

  const onRateChange = useCallback((e, name) => {
    let value = e;
    if(e && e.target) {
      name = e.target.name;
      value = e.target.value;
    }
    formDispatch({
      type: 'set_value',
      path: name,
      value: value,
      postReducer: rateReducer,
    });
  });

  const warpCols = useMemo(()=>getGridCols(['warps'], formDispatch, warpPostReducer, [
    {
      Header: 'Count',
      accessor: 'count',
    },
    {
      Header: 'Perct.',
      accessor: 'perct',
    },
    {
      Header: 'Wastage',
      accessor: 'wastage',
    },
    {
      Header: 'Rate',
      accessor: 'rate',
    },
    {
      Header: 'Sizing rate',
      accessor: 'sizing_rate',
      Footer: 'check;',
    },
    {
      Header: 'Weight(w/wastage)',
      accessor: 'weight_wastage',
      readOnly: true,
      showTotal: true,
    },
    {
      Header: 'Warp cost',
      accessor: 'cost',
      readOnly: true,
      showTotal: true,
    },
    {
      Header: 'Warp sizing cost',
      accessor: 'sizing_cost',
      readOnly: true,
      showTotal: true,
    },
  ], classes.gridCell), []);

  const weftCols = useMemo(()=>getGridCols(['wefts'], formDispatch, weftPostReducer, [
    {
      Header: 'Count',
      accessor: 'count',
    },
    {
      Header: 'Perct.',
      accessor: 'perct',
    },
    {
      Header: 'Wastage',
      accessor: 'wastage',
    },
    {
      Header: 'Rate',
      accessor: 'rate',
    },
    {
      Header: 'Weight(w/wastage)',
      accessor: 'weight_wastage',
      readOnly: true,
      showTotal: true,
    },
    {
      Header: 'Weft cost',
      accessor: 'cost',
      readOnly: true,
      showTotal: true,
    },
  ], classes.gridCell), []);

  const getDefaultRow = (cols) => {
    let row = {}
    cols.forEach((col)=>{
      if(col.id?.startsWith('btn')) {
        return;
      }
      row[col.accessor] = 0;
    });
    return row;
  }

  const theme = useTheme();
  const getSignalStyles = (num1, num2)=>{
    let styles = {}
    if(num1 > num2) {
      styles.backgroundColor = theme.palette.error.main;
      styles.color = theme.palette.error.contrastText;
      styles.opacity = 1;
    } else if(num1 < num2) {
      styles.backgroundColor = theme.palette.success.main;
      styles.color = theme.palette.success.contrastText;
      styles.opacity = 1;
    }
    return styles;
  }

  return (
    <Dialog onClose={onClose} disableEscapeKeyDown open={open} fullScreen scroll='paper' TransitionProps={{
      enter: false,
      exit: false,
    }}>
      <DialogTitle id="simple-dialog-title">
        <IconButton onClick={onClose} style={{marginRight: '0.5rem'}}><CloseOutlinedIcon /></IconButton>
        {editMode ? 'Update quality' : 'Add new quality'}
      </DialogTitle>
      <DialogContent dividers={true}>
        <FormRow>
          <FormRowItem>
            <FormInputText autoFocus label="Name" name='name' value={formData.name}
               errorMsg={formDataErr.name} onChange={onTextChange} />
          </FormRowItem>
          <FormRowItem>
            <FormInputText label="Notes" name='notes' value={formData.notes}
              errorMsg={formDataErr.notes} onChange={onTextChange} />
          </FormRowItem>
        </FormRow>
        <Grid container spacing={1}>
          <Grid item sm={12} md={12} lg={10} xl={10}>
            <Paper style={{height: '100%'}}>
              <Typography variant="h6" style={{textAlign: 'center', padding: '0.5rem'}}>Warp</Typography>
              <Divider />
              <Box style={{padding: '0.5rem'}}>
                <FormRow>
                  <FormRowItem>
                    <FormInputText type="number" type="number" label="Reed" name='warp_reed' value={formData.warp_reed}
                       errorMsg={formDataErr.warp_reed} onChange={onWarpTextChange} />
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Panna" name='warp_panna' value={formData.warp_panna}
                       errorMsg={formDataErr.warp_panna} onChange={onWarpTextChange} />
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Reed space" name='warp_reed_space' value={formData.warp_reed_space}
                       errorMsg={formDataErr.warp_reed_space} onChange={onWarpTextChange} />
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Lassa(Meters)" name='warp_meter' value={formData.warp_meter}
                       errorMsg={formDataErr.warp_meter} onChange={onWarpTextChange} />
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="L to L" name='warp_ltol' value={formData.warp_ltol}
                       errorMsg={formDataErr.warp_ltol} onChange={onWarpTextChange} />
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Total ends" name='warp_total_ends' value={formData.warp_total_ends}
                      readOnly />
                  </FormRowItem>
                </FormRow>
              </Box>
              <DataGrid columns={warpCols} data={formData.warps || []} showFooter={true} tdClassName={classes.inputGridTd} />
              <Button variant="outlined" color="primary" onClick={()=>{
                formDispatch({
                  type: 'add_grid_row',
                  path: 'warps',
                  value: getDefaultRow(warpCols),
                  postReducer: warpPostReducer,
                });
              }}>Add warp</Button>
              <Divider style={{marginTop: '0.5rem'}} />
              <Typography variant="h6" style={{textAlign: 'center', padding: '0.5rem'}}>Weft</Typography>
              <Divider />
              <Box style={{padding: '0.5rem'}}>
                <FormRow>
                  <FormRowItem>
                    <FormInputText type="number" label="Metre" name='weft_metre' value={formData.weft_metre}
                       errorMsg={formDataErr.weft_metre} onChange={onWeftTextChange} />
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Panna" name='weft_panna' value={formData.weft_panna}
                       errorMsg={formDataErr.panna} onChange={onWeftTextChange} />
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Reed space" name='weft_reed_space' value={formData.weft_reed_space}
                       errorMsg={formDataErr.reed_space} onChange={onWeftTextChange} />
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Pick" name='weft_pick' value={formData.weft_pick}
                       errorMsg={formDataErr.weft_pick} onChange={onWeftTextChange} />
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Job rate (paise)" name='weft_job_rate' value={formData.weft_job_rate}
                       errorMsg={formDataErr.weft_job_rate} onChange={onWeftTextChange} />
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Weaving charges" name='weaving_charges' value={formData.weaving_charges}
                      readOnly />
                  </FormRowItem>
                </FormRow>
              </Box>
              <DataGrid columns={weftCols} data={formData.wefts || []} showFooter={true} tdClassName={classes.inputGridTd} />
              <Button variant="outlined" color="primary" onClick={()=>{
                formDispatch({
                  type: 'add_grid_row',
                  path: 'wefts',
                  value: getDefaultRow(weftCols),
                  postReducer: weftPostReducer,
                });
              }}>Add weft</Button>
              <Divider style={{marginTop: '0.5rem'}} />
              <Typography variant="h6" style={{textAlign: 'center', padding: '0.5rem'}}>Rates</Typography>
              <Divider />
              <Box style={{padding: '0.5rem'}}>
                <FormRow>
                  <FormRowItem>
                    <FormInputText type="number" label="Rate(out) %" name='rate_out_per' value={formData.rate_out_per}
                       errorMsg={formDataErr.rate_out_per} onChange={onRateChange} />
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Rs" name='rate_out_rs' value={formData.rate_out_rs}
                       errorMsg={formDataErr.rate_out_rs} onChange={onRateChange} readOnly/>
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Demanded rate(out)" name='dem_rate_out_rs' value={formData.dem_rate_out_rs}
                       errorMsg={formDataErr.dem_rate_out_rs} onChange={onRateChange} />
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Profit(out) %" name='profit_out_per' value={formData.profit_out_per}
                       errorMsg={formDataErr.profit_out_per} onChange={onRateChange} readOnly
                       inputProps={{style: getSignalStyles(formData.rate_out_per, formData.profit_out_per)}} />
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Job rate(out) paise" name='job_rate_out' value={formData.job_rate_out}
                       errorMsg={formDataErr.job_rate_out} onChange={onRateChange} readOnly/>
                  </FormRowItem>
                </FormRow>
                <FormRow>
                  <FormRowItem>
                    <FormInputText type="number" label="Rate(local) %" name='rate_local_per' value={formData.rate_local_per}
                       errorMsg={formDataErr.rate_local_per} onChange={onRateChange} />
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Rs" name='rate_local_rs' value={formData.rate_local_rs}
                       errorMsg={formDataErr.rate_local_rs} onChange={onRateChange} readOnly/>
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Demanded rate(local)" name='dem_rate_local_rs' value={formData.dem_rate_local_rs}
                       errorMsg={formDataErr.dem_rate_local_rs} onChange={onRateChange} />
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Profit(local) %" name='profit_local_per' value={formData.profit_local_per}
                       errorMsg={formDataErr.profit_local_per} onChange={onRateChange} readOnly
                       inputProps={{style: getSignalStyles(formData.rate_local_per, formData.profit_local_per)}} />
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Job rate(local) paise" name='job_rate_local' value={formData.job_rate_local}
                       errorMsg={formDataErr.job_rate_local} onChange={onRateChange} readOnly/>
                  </FormRowItem>
                </FormRow>
              </Box>
            </Paper>
          </Grid>
          <Grid item sm={12} md={12} lg={2} xl={2}>
            <Paper style={{height: '100%'}}>
              <Typography variant="h6" style={{textAlign: 'center', padding: '0.5rem'}}>Summary</Typography>
              <Divider />
              <Box style={{padding: '0.5rem'}}>
                <FormInputText type="number" label="Warp weight" name='warp_weight' value={formData.warp_weight} readOnly />
                <Box style={{marginTop: '0.5rem'}}>
                  <FormInputText type="number" label="Warp weight w/wastage" name='warp_weight_wastage'
                    value={formData.warp_weight_wastage} readOnly />
                </Box>
                <Box style={{marginTop: '0.5rem'}}>
                  <FormInputText type="number" label="Weft weight" name='weft_weight'
                    value={formData.weft_weight} readOnly />
                </Box>
                <Box style={{marginTop: '0.5rem'}}>
                  <FormInputText type="number" label="Weft weight w/wastage" name='weft_weight_wastage'
                    value={formData.weft_weight_wastage} readOnly />
                </Box>
                <Box style={{marginTop: '0.5rem'}}>
                  <FormInputText type="number" label="Total weight" name='total_weight'
                    value={formData.total_weight} readOnly />
                </Box>
                <Box style={{marginTop: '0.5rem'}}>
                  <FormInputText type="number" label="Total weight w/wastage" name='total_weight_wastage'
                    value={formData.total_weight_wastage} readOnly />
                </Box>
                <Box style={{marginTop: '0.5rem'}}>
                  <FormInputText type="number" label="Actual cost" name='actual_cost'
                    value={formData.actual_cost} readOnly />
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions style={{justifyContent: 'flex-start'}}>
        <Button variant="contained" onClick={()=>{
          onSave(editMode ? false : true, formData);
        }} color="primary" disabled={!Boolean(formData.name)}>Save</Button>
        <Button variant="contained" onClick={()=>{
          onSave(true, formData);
        }} color="primary" disabled={!Boolean(formData.name)}>Copy and Save</Button>
        <Button variant="outlined" color="primary" style={{marginLeft: '0.5rem'}} disabled>Print(Coming soon)</Button>
        <Button variant="outlined" color="primary" onClick={onClose} style={{marginLeft: '0.5rem'}}>Cancel</Button>
      </DialogActions>
    </Dialog>
  )
}

export default connect((state)=>({
  qualities: state.qualities
}), (dispatch)=>({
  setNotification: (...args)=>{dispatch(setNotification.apply(this, args))},
  clearNotification: ()=>{dispatch(setNotification(null, null))},
}))(Calculator);