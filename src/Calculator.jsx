import { Box, Button, Card, CardContent, CardHeader, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton, makeStyles, OutlinedInput, Paper, Slide, Typography } from '@material-ui/core';
import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { connect } from 'react-redux';
import DataGrid from './DataGrid';
import { setNotification } from './store/reducers/notification';
import _ from 'lodash';
import { FormRowItem, FormInputText, FormRow } from './components/FormElements';
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
      if(action.gridReducer) {
        newState = action.gridReducer(newState);
      }
      break;
    case 'add_grid_row':
      rows = _.get(newState, action.path, []);
      rows.push(action.value);
      _.set(newState, action.path, rows);
      if(action.gridReducer) {
        newState = action.gridReducer(newState, true);
      }
      break;
    case 'remove_grid_row':
      rows = _.get(newState, action.path, []);
      rows.splice(action.value, 1);
      _.set(newState, action.path, rows);
      if(action.gridReducer) {
        newState = action.gridReducer(newState, true);
      }
      break;
  }

  newState.actual_cost = 0;
  newState.total_weight = parse(newState.warp_weight + newState.weft_weight);
  newState.total_weight_wastage = parse(newState.warp_weight_wastage + newState.weft_weight_wastage);

  for(let row of newState['warps'] || []) {
    newState.actual_cost  += row.cost + row.sizing_cost;
  }
  for(let row of newState['wefts'] || []) {
    newState.actual_cost  += row.cost;
  }
  newState.actual_cost += newState.weaving_charges;
  newState.actual_cost = parse(newState.actual_cost);
  return newState;
}

const warpGridReducer = (state, rowsChange=false)=>{
  state.warp_total_ends =  parse(state.warp_reed) * (parse(state.warp_panna) + parse(state.warp_reed_space));
  state.warp_weight = 0.0;
  state.warp_weight_wastage = 0.0;

  let gridValue = state['warps'];
  if(!gridValue) return state;

  let perct = (100/gridValue.length);

  for(let row of gridValue) {
    row.perct = rowsChange ? perct : row.perct;
    let weight =
      parse((state.warp_total_ends * parse(state.warp_lassa_yards)/(1852)/parse(row.count)/parse(state.warp_metre))
        * parse(row.perct)/100);

    row.weight = parse(weight + (parse(row.wastage) * weight)/100);
    state.warp_weight += weight;
    state.warp_weight_wastage += row.weight;

    row.cost = parse(row.weight * parse(row.rate));
    row.sizing_cost = parse(row.weight * parse(row.sizing_rate));
  }

  state.warp_weight = parse(state.warp_weight);
  state.warp_weight_wastage = parse(state.warp_weight_wastage);

  return state;
}

const weftGridReducer = (state, rowsChange)=>{
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

    row.weight = parse(weight + (parse(row.wastage) * weight)/100);
    state.weft_weight += weight;
    state.weft_weight_wastage += row.weight;

    row.cost = parse(row.weight * parse(row.rate));
  }

  return state;
}

function getGridCols(basePath, formDispatch, gridReducer, otherCols, cellClassName) {
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
          gridReducer: gridReducer,
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
            gridReducer: gridReducer,
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
      gridReducer: warpGridReducer,
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
      gridReducer: weftGridReducer,
    });
  });

  const warpCols = useMemo(()=>getGridCols(['warps'], formDispatch, warpGridReducer, [
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
      accessor: 'weight',
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

  const weftCols = useMemo(()=>getGridCols(['wefts'], formDispatch, weftGridReducer, [
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
      accessor: 'weight',
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
              required errorMsg={formDataErr.name} onChange={onTextChange} />
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
                      required errorMsg={formDataErr.warp_reed} onChange={onWarpTextChange} />
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Panna" name='warp_panna' value={formData.warp_panna}
                      required errorMsg={formDataErr.warp_panna} onChange={onWarpTextChange} />
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Reed space" name='warp_reed_space' value={formData.warp_reed_space}
                      required errorMsg={formDataErr.warp_reed_space} onChange={onWarpTextChange} />
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Lassa(Yards)" name='warp_lassa_yards' value={formData.warp_lassa_yards}
                      required errorMsg={formDataErr.warp_lassa_yards} onChange={onWarpTextChange} />
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Lassa(Metre)" name='warp_metre' value={formData.warp_metre}
                      required errorMsg={formDataErr.warp_metre} onChange={onWarpTextChange} />
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
                  gridReducer: warpGridReducer,
                });
              }}>Add warp</Button>
              <Divider style={{marginTop: '0.5rem'}} />
              <Typography variant="h6" style={{textAlign: 'center', padding: '0.5rem'}}>Weft</Typography>
              <Divider />
              <Box style={{padding: '0.5rem'}}>
                <FormRow>
                  <FormRowItem>
                    <FormInputText type="number" label="Metre" name='weft_metre' value={formData.weft_metre}
                      required errorMsg={formDataErr.weft_metre} onChange={onWeftTextChange} />
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Panna" name='weft_panna' value={formData.weft_panna}
                      required errorMsg={formDataErr.panna} onChange={onWeftTextChange} />
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Reed space" name='weft_reed_space' value={formData.weft_reed_space}
                      required errorMsg={formDataErr.reed_space} onChange={onWeftTextChange} />
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Pick" name='weft_pick' value={formData.weft_pick}
                      required errorMsg={formDataErr.weft_pick} onChange={onWeftTextChange} />
                  </FormRowItem>
                  <FormRowItem>
                    <FormInputText type="number" label="Job rate" name='weft_job_rate' value={formData.weft_job_rate}
                      required errorMsg={formDataErr.weft_job_rate} onChange={onWeftTextChange} />
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
                  gridReducer: weftGridReducer,
                });
              }}>Add weft</Button>
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