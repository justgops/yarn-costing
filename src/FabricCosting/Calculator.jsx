import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Card, CardContent, CardHeader, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton, makeStyles, OutlinedInput, Paper, Slide, Typography, useTheme } from '@material-ui/core';
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { connect } from 'react-redux';
import DataGrid, { TableLayout, TableLayoutCell, TableLayoutRow } from '../components/DataGrid';
import { setNotification } from '../store/reducers/notification';
import _ from 'lodash';
import { FormRowItem, FormInputText, FormRow } from '../components/FormElements';
import DeleteForeverRoundedIcon from '@material-ui/icons/DeleteForeverRounded';
import CloseOutlinedIcon from '@material-ui/icons/CloseOutlined';
import ReactToPrint from 'react-to-print';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SettingsOutlinedIcon from '@material-ui/icons/SettingsOutlined';
import { getSettings } from '../store/reducers/settings';

const ROUND_DECIMAL = 5;

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
  },
  page: {
    width: '297mm',
    backgroundColor: '#fff',
    padding: '5mm',
    color: '#000',
    fontSize: '16px',
  },
  borderBottom: {
    borderBottom: '1px solid '+theme.palette.grey[500],
  },
  borderTop: {
    borderTop: '1px solid '+theme.palette.grey[500],
  }
}));

const getFormReducer = (settings)=>(state, action)=>{
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
        parse((state.warp_total_ends * parse(state.warp_meter)/parse(settings.length_per_count)/parse(row.count)/parse(state.warp_ltol))
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
    state.actual_elong_shrink = parse(state.elong_shrink)*state.actual_cost;
    state.market_elong_shrink = parse(state.elong_shrink)*state.market_cost;

    state.actual_rate_wastage = parse(state.rate_wastage)*3;
    state.market_rate_wastage = parse(state.rate_wastage)*3;

    state.actual_rate_others = parse(state.rate_others)*4;
    state.market_rate_others = parse(state.rate_others)*4;

    state.actual_total = parse(state.process_charge) + state.actual_elong_shrink + state.actual_rate_wastage + state.actual_rate_others;
    state.market_total = parse(state.process_charge) + state.market_elong_shrink + state.market_rate_wastage + state.market_rate_others;
    return state;
  }

  let newState = _.cloneDeep(state);
  let rows = null;

  const processPostReducer = (postReducer, rowsChange)=>{
    if(postReducer == 'warp') {
      newState = warpPostReducer(newState, rowsChange);
    } else if(postReducer == 'weft') {
      newState = weftPostReducer(newState, rowsChange);
    } else if(postReducer == 'all') {
      newState = weftPostReducer(warpPostReducer(newState, rowsChange), rowsChange);
    }
  }
  switch(action.type) {
    case 'init':
      newState = action.value;
      action.postReducer = 'all';
      processPostReducer(action.postReducer);
      break;
    case 'set_value':
      _.set(newState, action.path, action.value);
      processPostReducer(action.postReducer);
      break;
    case 'add_grid_row':
      rows = _.get(newState, action.path, []);
      rows.push(action.value);
      _.set(newState, action.path, rows);
      processPostReducer(action.postReducer, true);
      break;
    case 'remove_grid_row':
      rows = _.get(newState, action.path, []);
      rows.splice(action.value, 1);
      _.set(newState, action.path, rows);
      processPostReducer(action.postReducer, true);
      break;
  }

  if(action.postReducer) {
    newState = globalReducer(newState);
    newState = rateReducer(newState);
  }
  return newState;
}




function getGridCols(basePath, formDispatch, postReducer, otherCols, cellClassName) {
  let baseCols = [{
    Header: '',
    id: 'id',
    Print: ({row})=>row.index+1,
    PrintFooter: '',
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
      Print: ({value, row})=>value,
      PrintFooter: col.showTotal ? (info)=>{
        let total = info.rows.reduce((sum, row) => {
            return (row.values[col.accessor] || 0) + sum
          }, 0
        );
        total = parse(total);
        return total;
      } : '',
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

function Calculator({open, onClose, onSave, data, settings}) {
  const classes = useStyles();
  const editMode = !_.isNull(data) && !_.isUndefined(data);
  const [formData, formDispatch] = useReducer(getFormReducer(settings), data);
  const [formDataErr, setFormDataErr] = useState({});

  useEffect(()=>{
    formDispatch({
      type: 'init',
      value: data || {
        set_length_count: 1693.33,
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
      postReducer: 'warp',
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
      postReducer: 'weft',
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
    });
  });

  const warpCols = useMemo(()=>getGridCols(['warps'], formDispatch, 'warp', [
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

  const weftCols = useMemo(()=>getGridCols(['wefts'], formDispatch, 'weft',[
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

  const reportRef = useRef()
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
                  postReducer: 'warp',
                });
              }}>Add warp</Button>
              <Divider style={{marginTop: '0.5rem'}} />
              <Typography variant="h6" style={{textAlign: 'center', padding: '0.5rem'}}>Weft</Typography>
              <Divider />
              <Box style={{padding: '0.5rem'}}>
                <FormRow>
                  <FormRowItem>
                    <FormInputText type="number" label="Meter" name='weft_metre' value={formData.weft_metre}
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
                  postReducer: 'weft',
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
        <Paper style={{marginTop: '0.5rem'}}>
          <Typography variant="h6" style={{textAlign: 'center', padding: '0.5rem'}}>Rates</Typography>
          {/* <Divider /> */}
          <Box style={{padding: '0.5rem'}}>
            <Grid container spacing={1}>
              <Grid item md={2} sm={12} xs={12}>
                <Box>
                  <FormInputText type="number" label="Brokerage %" name='brokerage_per' value={formData.brokerage_per}
                    errorMsg={formDataErr.brokerage_per} onChange={onRateChange} />
                </Box>
                <Box style={{marginTop: '0.5rem'}}>
                  <FormInputText type="number" label="Interest %" name='interest_per' value={formData.interest_per}
                    errorMsg={formDataErr.interest_per} onChange={onRateChange} />
                </Box>
                <Box style={{marginTop: '0.5rem'}}>
                  <FormInputText type="number" label="Cash discount %" name='cashdisc_per' value={formData.cashdisc_per}
                    errorMsg={formDataErr.cashdisc_per} onChange={onRateChange} />
                </Box>
                <Box style={{marginTop: '0.5rem'}}>
                  <FormInputText type="number" label="Others %" name='others_per' value={formData.others_per}
                    errorMsg={formDataErr.others_per} onChange={onRateChange} />
                </Box>
                <Box style={{marginTop: '0.5rem'}}>
                  <FormInputText type="number" label="Actual final cost" name='actual_final_cost' value={formData.actual_final_cost}
                    errorMsg={formDataErr.actual_final_cost} onChange={onRateChange} readOnly />
                </Box>
              </Grid>
              <Grid item md={1} sm={12} xs={12}></Grid>
              <Grid item md={8} sm={12} xs={12}>
                <TableLayout>
                  <TableLayoutRow>
                    <TableLayoutCell></TableLayoutCell>
                    <TableLayoutCell></TableLayoutCell>
                    <TableLayoutCell>Actual Cost based</TableLayoutCell>
                    <TableLayoutCell>Market Cost based</TableLayoutCell>
                  </TableLayoutRow>
                  <TableLayoutRow>
                    <TableLayoutCell className={classes.borderBottom}></TableLayoutCell>
                    <TableLayoutCell className={classes.borderBottom}></TableLayoutCell>
                    <TableLayoutCell className={classes.borderBottom}>
                      <OutlinedInput type="number" name='actual_cost' value={formData.actual_cost}
                        errorMsg={formDataErr.rate_others} readOnly fullWidth/>
                    </TableLayoutCell>
                    <TableLayoutCell className={classes.borderBottom}>
                      <OutlinedInput type="number" name='market_cost' value={formData.market_cost}
                        errorMsg={formDataErr.market_cost} onChange={onRateChange} fullWidth/>
                    </TableLayoutCell>
                  </TableLayoutRow>
                  <TableLayoutRow>
                    <TableLayoutCell>Process Charge</TableLayoutCell>
                    <TableLayoutCell>
                      <FormInputText type="number" name='process_charge' value={formData.process_charge}
                        errorMsg={formDataErr.process_charge} onChange={onRateChange} fullWidth />
                    </TableLayoutCell>
                    <TableLayoutCell>
                      <FormInputText type="number" name='process_charge' value={formData.process_charge} readOnly/>
                    </TableLayoutCell>
                    <TableLayoutCell>
                      <FormInputText type="number" name='process_charge' value={formData.process_charge} readOnly/>
                    </TableLayoutCell>
                  </TableLayoutRow>
                  <TableLayoutRow>
                    <TableLayoutCell>Elongation/Shrinkage</TableLayoutCell>
                    <TableLayoutCell>
                      <FormInputText type="number" name='elong_shrink' value={formData.elong_shrink}
                        errorMsg={formDataErr.elong_shrink} onChange={onRateChange} fullWidth />
                    </TableLayoutCell>
                    <TableLayoutCell>
                      <FormInputText type="number" name='actual_elong_shrink' value={formData.actual_elong_shrink} readOnly/>
                    </TableLayoutCell>
                    <TableLayoutCell>
                      <FormInputText type="number" name='market_elong_shrink' value={formData.market_elong_shrink} readOnly/>
                    </TableLayoutCell>
                  </TableLayoutRow>
                  <TableLayoutRow>
                    <TableLayoutCell>Wastage</TableLayoutCell>
                    <TableLayoutCell>
                      <FormInputText type="number" name='rate_wastage' value={formData.rate_wastage}
                        errorMsg={formDataErr.rate_wastage} onChange={onRateChange} fullWidth />
                    </TableLayoutCell>
                    <TableLayoutCell>
                      <FormInputText type="number" name='actual_rate_wastage' value={formData.actual_rate_wastage}
                        errorMsg={formDataErr.actual_rate_wastage} readOnly/>
                    </TableLayoutCell>
                    <TableLayoutCell>
                      <FormInputText type="number" name='market_rate_wastage' value={formData.market_rate_wastage}
                        errorMsg={formDataErr.market_rate_wastage} readOnly/>
                    </TableLayoutCell>
                  </TableLayoutRow>
                  <TableLayoutRow>
                    <TableLayoutCell>Others</TableLayoutCell>
                    <TableLayoutCell>
                      <FormInputText type="number" name='rate_others' value={formData.rate_others}
                        errorMsg={formDataErr.rate_others} onChange={onRateChange} fullWidth />
                    </TableLayoutCell>
                    <TableLayoutCell>
                      <FormInputText type="number" name='actual_rate_others' value={formData.actual_rate_others}
                        errorMsg={formDataErr.actual_rate_others} readOnly/>
                    </TableLayoutCell>
                    <TableLayoutCell>
                      <FormInputText type="number" name='market_rate_others' value={formData.market_rate_others}
                        errorMsg={formDataErr.market_rate_others} readOnly/>
                    </TableLayoutCell>
                  </TableLayoutRow>
                  <TableLayoutRow>
                    <TableLayoutCell className={classes.borderTop}></TableLayoutCell>
                    <TableLayoutCell className={classes.borderTop}>Total</TableLayoutCell>
                    <TableLayoutCell className={classes.borderTop}>
                      <FormInputText type="number" name='actual_total' value={formData.actual_total}
                        errorMsg={formDataErr.actual_total} readOnly/>
                    </TableLayoutCell>
                    <TableLayoutCell className={classes.borderTop}>
                      <FormInputText type="number" name='market_total' value={formData.market_total}
                        errorMsg={formDataErr.market_total} readOnly/>
                    </TableLayoutCell>
                  </TableLayoutRow>
                </TableLayout>
              </Grid>

            </Grid>
          </Box>
        </Paper>
        <Box display="none">
          <PrintPage formData={formData} printRef={reportRef} warpCols={warpCols} weftCols={weftCols}/>
        </Box>
      </DialogContent>
      <DialogActions style={{justifyContent: 'flex-start'}}>
        <Button variant="contained" onClick={()=>{
          onSave(editMode ? false : true, formData);
        }} color="primary" disabled={!Boolean(formData.name)}>Save</Button>
        <Button variant="contained" onClick={()=>{
          onSave(true, formData);
        }} color="primary" disabled={!Boolean(formData.name)}>Copy and Save</Button>
        <ReactToPrint
          trigger={()=><Button color="primary" variant="outlined" style={{marginLeft: '0.5rem'}}>Print</Button>}
          content={()=>reportRef.current}
          pageStyle={pageStyle}
          documentTitle={'Costing-'+formData.name}
        />
        {/* <Button variant="outlined" color="primary" style={{marginLeft: '0.5rem'}} disabled>Print(Coming soon)</Button> */}
        <Button variant="outlined" color="primary" onClick={onClose} style={{marginLeft: '0.5rem'}}>Cancel</Button>
      </DialogActions>
    </Dialog>
  )
}

const pageStyle = `
  @page {
    size: A4 landscape;
    margin: 0mm;
  }
`;

const useReportStyles = makeStyles((theme)=>({
  page: {
    width: '297mm',
    backgroundColor: '#fff',
    padding: '5mm',
    color: '#000',
    fontSize: '16px',
  },
}));

function PrintPage({printRef, formData, warpCols, weftCols}) {
  const classes = useReportStyles();
  return (
    <Box ref={printRef} className={classes.page}>
      <Box textAlign="center">
        <h3>Fabric Costing</h3>
      </Box>
      {/* <Divider /> */}
      <Box borderTop={1}/>
      <Box p={1}>
        <PrintField label="Quality Name" value={formData.name} />
      </Box>
      <Box borderTop={1}/>
      <Grid container>
        <Grid item xs={12}>
          <Box>
            <Box textAlign="center">
              <h3>Warp</h3>
            </Box>
            <Box display="flex" flexWrap="wrap">
              <PrintField label="Reed Name" value={formData.warp_reed} />
              <PrintField margin label="Panna" value={formData.warp_panna} />
              <PrintField margin label="Reed space" value={formData.warp_reed_space} />
              <PrintField margin label="Lassa(Meters)" value={formData.warp_meter} />
              <PrintField margin label="L to L" value={formData.warp_ltol} />
              <PrintField margin label="Total ends" value={formData.warp_total_ends} />
            </Box>
            <DataGrid columns={warpCols} data={formData.warps || []} showFooter={true} print={true}/>
          </Box>
          <Box>
            <Box textAlign="center">
              <h3>Weft</h3>
            </Box>
            <Box display="flex" flexWrap="wrap">
              <PrintField label="Meter" value={formData.weft_metre} />
              <PrintField margin label="Panna" value={formData.weft_panna} />
              <PrintField margin label="Reed space" value={formData.weft_reed_space} />
              <PrintField margin label="Pick" value={formData.weft_pick} />
              <PrintField margin label="Job rate (paise)" value={formData.weft_job_rate} />
              <PrintField margin label="Weaving charges" value={formData.weaving_charges} />
            </Box>
            <DataGrid columns={weftCols} data={formData.wefts || []} showFooter={true} print={true}/>
          </Box>
        </Grid>
      </Grid>
      <Divider />
      <PrintField label="Gross rate" rs={true} value={formData.actual_cost} />
      <PrintField label="Rate local" rs={true} value={formData.rate_local_rs} />
      <PrintField label="Rate out" rs={true} value={formData.rate_out_rs} />
      <Box position="fixed" bottom="0" left="0" right="0" textAlign="center" fontSize="0.6em">Generated by Costing software by team Yantra - yantra.contact@gmail.com</Box>
    </Box>
  )
}

function PrintField({label, value, rs, margin, ...props}) {
  return (
    <Box {...props} marginLeft={margin ? '1rem' : 0}>
      <span style={{fontWeight: 'bold'}}>{label}</span>: {rs && 'Rs. '}<span>{value}</span>
    </Box>
  )
}

export default connect((state)=>({settings: getSettings(state)}), (dispatch)=>({
  setNotification: (...args)=>{dispatch(setNotification.apply(this, args))},
  clearNotification: ()=>{dispatch(setNotification(null, null))},
}))(Calculator);