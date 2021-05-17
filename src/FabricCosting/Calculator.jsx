import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Card, CardContent, CardHeader, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, Grid, IconButton, makeStyles, OutlinedInput, Paper, Slide, Tab, Tabs, Typography, useTheme } from '@material-ui/core';
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { connect } from 'react-redux';
import DataGrid, { TableLayout, TableLayoutCell, TableLayoutRow } from '../components/DataGrid';
import { setNotification } from '../store/reducers/notification';
import _ from 'lodash';
import { FormRowItem, FormInputText, FormRow, FormInputSelect, FormInfo } from '../components/FormElements';
import DeleteForeverRoundedIcon from '@material-ui/icons/DeleteForeverRounded';
import CloseOutlinedIcon from '@material-ui/icons/CloseOutlined';
import ReactToPrint from 'react-to-print';
import { getSettings } from '../store/reducers/settings';
import clsx from 'clsx';
import TabPanel from '../components/TabPanel';
import { LASSA_UNIT_OPTIONS } from '../Settings';

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
  },
  alignRight: {
    textAlign: 'right',
  }
}));

function getProdCostWithBreakup(state) {
  let prod_cost = 0;
  let breakup = {
    "Total warp cost": 0,
    "Total sizing cost": 0,
    "Total weft cost": 0,
    "Weaving charges": state.weaving_charges,
  };
  for(let row of state['warps'] || []) {
    breakup["Total warp cost"] += row.cost;
    breakup["Total sizing cost"] += row.sizing_cost;
  }
  for(let row of state['wefts'] || []) {
    breakup["Total weft cost"]  += row.cost;
  }
  prod_cost += breakup["Total warp cost"] + breakup["Total sizing cost"] + breakup["Total weft cost"] + breakup["Weaving charges"];
  return [parse(prod_cost), breakup];
}

const getFormReducer = (settings)=>(state, action)=>{
  const warpWeftReducer = (state)=>{

    state.total_weight = parse(state.warp_weight + state.weft_weight);
    state.total_weight_wastage = parse(state.warp_weight_wastage + state.weft_weight_wastage);
    [state.prod_cost, state.breakups.prod_cost] = getProdCostWithBreakup(state);
    return state;
  }

  const warpPostReducer = (state, rowsChange=false)=>{
    state.warp_total_ends =  parse(state.warp_reed) * (parse(state.warp_panna) + parse(state.warp_reed_space));
    state.warp_cramp = parse((parse(state.warp_lassa)-parse(state.warp_ltol))/parse(state.warp_lassa)*100);
    state.warp_weight = 0.0;
    state.warp_weight_wastage = 0.0;

    let gridValue = state['warps'];
    if(!gridValue) return state;

    let perct = (100/gridValue.length);
    let length_per_count = parse(_.find(LASSA_UNIT_OPTIONS, (o)=>o.value==settings.lassa_unit).figure);
    for(let row of gridValue) {
      row.perct = rowsChange ? perct : row.perct;
      let weight =
        parse((state.warp_total_ends * parse(state.warp_lassa)/length_per_count/parse(row.count)/parse(state.warp_ltol))
          * parse(row.perct)/100);

      row.weight_wastage = parse(weight + (parse(row.wastage) * weight)/100);
      state.warp_weight += weight;
      state.warp_weight_wastage += row.weight_wastage;

      let rate = row.rate - (row.rate_wgst ? row.rate*settings.warp_rate_gst/100 : 0);
      let sizing_rate = row.sizing_rate - (row.sizing_rate_wgst ? row.rate*settings.sizing_rate_gst/100 : 0);
      row.cost = parse(row.weight_wastage * parse(rate));
      row.sizing_cost = parse(row.weight_wastage * parse(sizing_rate));
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
        parse((parse(state.weft_meter) * (parse(state.weft_panna) + parse(state.weft_reed_space)) * parse(state.weft_pick)/(1693.33*row.count))
          *parse(row.perct)/100);

      row.weight_wastage = parse(weight + (parse(row.wastage) * weight)/100);
      state.weft_weight += weight;
      state.weft_weight_wastage += row.weight_wastage;

      let rate = row.rate - (row.rate_wgst ? row.rate*settings.weft_rate_gst/100 : 0);
      row.cost = parse(row.weight_wastage * parse(rate));
    }

    return state;
  }

  const rateReducer = (state)=>{
    /* Gray fabric */
    state.gray_brokerage_calc = parse(parse(state.gray_market_price)*parse(state.gray_brokerage)/100);
    state.gray_interest_calc = parse(state.prod_cost*parse(state.gray_interest)/100);
    state.gray_cashdisc_calc = parse(parse(state.gray_market_price)*parse(state.gray_cashdisc)/100);
    state.gray_others_calc = parse(state.prod_cost*parse(state.gray_others)/100);
    state.gray_total = parse(state.prod_cost + state.gray_brokerage_calc + state.gray_interest_calc
      + state.gray_cashdisc_calc + state.gray_others_calc);

    state.gray_profit =  parse((parse(state.gray_market_price)/state.gray_total-1)*100);
    let totalWarpCost = 0;
    let totalWarpSizCost = 0;
    let totalWeftCost = 0;
    for(let row of state['warps'] || []) {
      totalWarpCost += row.cost;
      totalWarpSizCost += row.sizing_cost;
    }
    for(let row of state['wefts'] || []) {
      state.totalWeftCost  += row.cost;
    }
    state.gray_revjobrate = parse((parse(state.gray_market_price)-state.gray_brokerage_calc-state.gray_interest_calc
      -state.gray_cashdisc_calc-state.gray_others_calc-totalWarpCost-totalWarpSizCost-totalWeftCost)/state.weft_pick);

    /* Finish fabric */
    state.fin_prod_elongshrink = parse(state.prod_cost*parse(state.fin_elongshrink)/100);
    state.fin_gray_elongshrink = parse(parse(state.fin_gray_price)*parse(state.fin_elongshrink)/100);

    state.fin_prod_wastage = parse((state.prod_cost+parse(state.fin_process_charge)+state.fin_prod_elongshrink)
      *parse(state.fin_wastage)/100);
    state.fin_gray_wastage = parse((parse(state.fin_gray_price)+parse(state.fin_process_charge)+state.fin_gray_elongshrink)
      *parse(state.fin_wastage)/100);

    let elongshrink = state.fin_elongshrink_opt === 'elongation' ? -1 : 1;
    state.fin_prod_total = parse(state.prod_cost+parse(state.fin_process_charge)+elongshrink*state.fin_prod_elongshrink
      +state.fin_prod_wastage+parse(state.fin_packing)+parse(state.fin_others));
    state.fin_gray_total = parse(parse(state.fin_gray_price)+parse(state.fin_process_charge)+elongshrink*state.fin_gray_elongshrink
      +state.fin_gray_wastage+parse(state.fin_packing)+parse(state.fin_others));

    state.fin_prod_profit = parse((parse(state.fin_market_price)-state.fin_prod_total)/state.fin_prod_total*100);
    state.fin_gray_profit = parse((parse(state.fin_market_price)-state.fin_gray_total)/state.fin_gray_total*100);
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

  // if(action.postReducer) {
  newState = warpWeftReducer(newState);
  newState = rateReducer(newState);
  // }
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
        let gstKey = column.id+'_wgst';
        return (
        <Box display="flex">
        <OutlinedInput fullWidth className={cellClassName} type="number" value={value} readOnly={col.readOnly} onChange={(e)=>{
          let value = e.target.value;
          formDispatch({
            type: 'set_value',
            path: basePath.concat([row.index, column.id]),
            value: value,
            postReducer: postReducer,
          });
        }} />
        {col.GST &&<FormControlLabel
          control={
            <Checkbox
              color="primary"
              size="small"
              checked={row.values[gstKey]}
              onChange={(e)=>{
                let value = e.target.checked;
                formDispatch({
                  type: 'set_value',
                  path: basePath.concat([row.index, gstKey]),
                  value: value,
                  postReducer: postReducer,
                });
              }}
            />
          }
          label="w/GST"
        />}
        </Box>)
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
      value: {
        fin_elongshrink_opt: 'elongation',
        ...data,
        weft_meter: 1,
        breakups: {},
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
      Header: 'Perct.(%)',
      accessor: 'perct',
    },
    {
      Header: 'Wastage(%)',
      accessor: 'wastage',
    },
    {
      Header: 'Rate(Per Kg)',
      accessor: 'rate',
      GST: true,
    },
    {
      Header: 'Sizing rate(Per Kg)',
      accessor: 'sizing_rate',
      Footer: 'check;',
      GST: true,
    },
    {
      Header: 'Weight w/wastage(Kg)',
      accessor: 'weight_wastage',
      readOnly: true,
      showTotal: true,
    },
    {
      Header: 'Warp cost(Rs)',
      accessor: 'cost',
      readOnly: true,
      showTotal: true,
    },
    {
      Header: 'Warp sizing cost(Rs)',
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
      Header: 'Perct.(%)',
      accessor: 'perct',
    },
    {
      Header: 'Wastage(%)',
      accessor: 'wastage',
    },
    {
      Header: 'Rate(Rs per Kg)',
      accessor: 'rate',
      GST: true,
    },
    {
      Header: 'Weight w/wastage(Kg)',
      accessor: 'weight_wastage',
      readOnly: true,
      showTotal: true,
    },
    {
      Header: 'Weft cost(Rs)',
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

  const [tabvalue, setTabvalue] = React.useState(0);

  const tabChange = (event, newValue) => {
    setTabvalue(newValue);
  };

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
        <Box display="flex" flexDirection="column" height="100%" style={{minHeight: 0}}>
          <Box>
            <Tabs value={tabvalue} onChange={tabChange} aria-label="simple tabs example">
              <Tab label="Costing" />
              <Tab label="Packing" />
            </Tabs>
          </Box>
          <TabPanel value={tabvalue} index={0}>
            <Grid container spacing={1}>
              <Grid item sm={12} md={12} lg={10} xl={10}>
                <Paper style={{height: '100%'}}>
                  <Typography color="secondary" variant="h6" style={{textAlign: 'center', padding: '0.5rem'}}>Warp</Typography>
                  <Divider />
                  <Box style={{padding: '0.5rem'}}>
                    <FormRow>
                      <FormRowItem>
                        <FormInputText type="number" type="number" label="EPI/Reed" name='warp_reed' value={formData.warp_reed}
                          errorMsg={formDataErr.warp_reed} onChange={onWarpTextChange} />
                      </FormRowItem>
                      <FormRowItem>
                        <FormInputText type="number" label="Width/Panna" name='warp_panna' value={formData.warp_panna}
                          errorMsg={formDataErr.warp_panna} onChange={onWarpTextChange} />
                      </FormRowItem>
                      <FormRowItem>
                        <FormInputText type="number" label="Extra Reed Space" name='warp_reed_space' value={formData.warp_reed_space}
                          errorMsg={formDataErr.warp_reed_space} onChange={onWarpTextChange} />
                      </FormRowItem>
                      <FormRowItem>
                        <FormInputText type="number" label={`Cut Mark/Lassa (${(_.find(LASSA_UNIT_OPTIONS, (o)=>o.value==settings.lassa_unit)||{label: ''}).label})`} name='warp_lassa' value={formData.warp_lassa}
                          errorMsg={formDataErr.warp_lassa} onChange={onWarpTextChange} />
                      </FormRowItem>
                      <FormRowItem>
                        <FormInputText type="number" label="Cut Length/L to L" name='warp_ltol' value={formData.warp_ltol}
                          errorMsg={formDataErr.warp_ltol} onChange={onWarpTextChange} />
                      </FormRowItem>
                      <FormRowItem>
                        <FormInputText type="number" label="Cramp(%)" name='warp_cramp' value={formData.warp_cramp}
                          errorMsg={formDataErr.warp_cramp} onChange={onWarpTextChange} readOnly/>
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
                  <Typography color="secondary" variant="h6" style={{textAlign: 'center', padding: '0.5rem'}}>Weft</Typography>
                  <Divider />
                  <Box style={{padding: '0.5rem'}}>
                    <FormRow>
                      <FormRowItem>
                        <FormInputText type="number" label="Meter" name='weft_meter' value={formData.weft_meter}
                          errorMsg={formDataErr.weft_meter} readOnly/>
                      </FormRowItem>
                      <FormRowItem>
                        <FormInputText type="number" label="Width/Panna(Inch)" name='weft_panna' value={formData.weft_panna}
                          errorMsg={formDataErr.panna} onChange={onWeftTextChange} />
                      </FormRowItem>
                      <FormRowItem>
                        <FormInputText type="number" label="Exta Reed Space(Inch)" name='weft_reed_space' value={formData.weft_reed_space}
                          errorMsg={formDataErr.reed_space} onChange={onWeftTextChange} />
                      </FormRowItem>
                      <FormRowItem>
                        <FormInputText type="number" label="PPI(Pick)" name='weft_pick' value={formData.weft_pick}
                          errorMsg={formDataErr.weft_pick} onChange={onWeftTextChange} />
                      </FormRowItem>
                      <FormRowItem>
                        <FormInputText type="number" label="Job Rate(paise)" name='weft_job_rate' value={formData.weft_job_rate}
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
                  <Typography color="secondary" variant="h6" style={{textAlign: 'center', padding: '0.5rem'}}>Summary(Kg)</Typography>
                  <Divider />
                  <Box style={{padding: '0.5rem'}}>
                    <FormInputText type="number" label="Warp weight" name='warp_weight' value={formData.warp_weight} readOnly />
                    <Box style={{marginTop: '0.5rem'}}>
                      <FormInputText type="number" label="Weft weight" name='weft_weight'
                        value={formData.weft_weight} readOnly />
                    </Box>
                    <Box style={{marginTop: '0.5rem'}}>
                      <FormInputText type="number" label="Total weight" name='total_weight'
                        value={formData.total_weight} readOnly highlight/>
                    </Box>
                    <Box style={{marginTop: '0.5rem'}}>
                      <FormInputText type="number" label="Warp weight w/wastage" name='warp_weight_wastage'
                        value={formData.warp_weight_wastage} readOnly />
                    </Box>
                    <Box style={{marginTop: '0.5rem'}}>
                      <FormInputText type="number" label="Weft weight w/wastage" name='weft_weight_wastage'
                        value={formData.weft_weight_wastage} readOnly />
                    </Box>
                    <Box style={{marginTop: '0.5rem'}}>
                      <FormInputText type="number" label="Total weight w/wastage" name='total_weight_wastage'
                        value={formData.total_weight_wastage} readOnly highlight/>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
            <Paper style={{marginTop: '0.5rem'}}>
              <Typography color="secondary" variant="h6" style={{textAlign: 'center', padding: '0.5rem'}}>Cost breakup</Typography>
              <Divider />
              <Box style={{padding: '0.5rem'}}>
                <Grid container spacing={1}>
                  <Grid item md={4} sm={12} xs={12}>
                    <TableLayout>
                      <TableLayoutRow>
                        <TableLayoutCell colspan={4} className={classes.borderBottom} style={{textAlign: 'center'}}>
                          <Typography color="secondary">Gray Fabric</Typography>
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell></TableLayoutCell>
                        <TableLayoutCell></TableLayoutCell>
                        <TableLayoutCell>
                          <Box>
                          Production cost
                          <FormInfo>
                            <Box p={1}>
                              <TableLayout>
                                {formData.breakups?.prod_cost && Object.keys(formData.breakups.prod_cost).map((b)=>{
                                  return (
                                    <TableLayoutRow>
                                      <TableLayoutCell>{b}</TableLayoutCell>
                                      <TableLayoutCell>{formData.breakups.prod_cost[b]}</TableLayoutCell>
                                    </TableLayoutRow>
                                  )
                                })}
                              </TableLayout>
                            </Box>
                          </FormInfo>
                          </Box>
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell className={classes.borderBottom}></TableLayoutCell>
                        <TableLayoutCell className={classes.borderBottom}></TableLayoutCell>
                        <TableLayoutCell className={classes.borderBottom}>
                          <FormInputText type="number" name='prod_cost' value={formData.prod_cost}
                            readOnly />
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell>Gray market price</TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='gray_market_price' value={formData.gray_market_price}
                            onChange={onRateChange} />
                        </TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='gray_market_price' value={formData.gray_market_price} readOnly />
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell>Brokerage(%)</TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='gray_brokerage' value={formData.gray_brokerage}
                            onChange={onRateChange} />
                        </TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='gray_brokerage_calc' value={formData.gray_brokerage_calc} readOnly />
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell>Interest(%)</TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='gray_interest' value={formData.gray_interest}
                            onChange={onRateChange} />
                        </TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='gray_interest_calc' value={formData.gray_interest_calc} readOnly />
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell>Cash discount(%)</TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='gray_cashdisc' value={formData.gray_cashdisc}
                            onChange={onRateChange} />
                        </TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='gray_cashdisc_calc' value={formData.gray_cashdisc_calc} readOnly />
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell>Others(%)</TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='gray_others' value={formData.gray_others}
                            onChange={onRateChange} />
                        </TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='gray_others_calc' value={formData.gray_others_calc} readOnly />
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell className={classes.borderTop}></TableLayoutCell>
                        <TableLayoutCell className={clsx(classes.borderTop, classes.alignRight)}>Total</TableLayoutCell>
                        <TableLayoutCell className={classes.borderTop}>
                          <FormInputText type="number" name='gray_total' value={formData.gray_total} readOnly highlight/>
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell></TableLayoutCell>
                        <TableLayoutCell className={classes.alignRight}>Profit(%)</TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='gray_profit' value={formData.gray_profit} readOnly profit/>
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell></TableLayoutCell>
                        <TableLayoutCell className={classes.alignRight}>Reverse Job Rate(Paise)</TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='gray_revjobrate' value={formData.gray_revjobrate} readOnly highlight/>
                        </TableLayoutCell>
                      </TableLayoutRow>
                    </TableLayout>
                  </Grid>
                  <Grid item md={1} sm={12} xs={12}></Grid>
                  <Grid item md={7} sm={12} xs={12}>
                    <TableLayout>
                      <TableLayoutRow>
                        <TableLayoutCell colspan={4} className={classes.borderBottom} style={{textAlign: 'center'}}>
                          <Typography color="secondary">Finish Fabric</Typography>
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell></TableLayoutCell>
                        <TableLayoutCell></TableLayoutCell>
                        <TableLayoutCell>Production cost</TableLayoutCell>
                        <TableLayoutCell>Gray market price</TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell className={classes.borderBottom}></TableLayoutCell>
                        <TableLayoutCell className={classes.borderBottom}></TableLayoutCell>
                        <TableLayoutCell className={classes.borderBottom}>
                          <FormInputText type="number" name='prod_cost' value={formData.prod_cost}
                            readOnly/>
                        </TableLayoutCell>
                        <TableLayoutCell className={classes.borderBottom}>
                          <FormInputText type="number" name='fin_gray_price' value={formData.fin_gray_price}
                            onChange={onRateChange} />
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell>Process Charge(Rs.)</TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='fin_process_charge' value={formData.fin_process_charge}
                            onChange={onRateChange} />
                        </TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='fin_process_charge' value={formData.fin_process_charge} readOnly/>
                        </TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='fin_process_charge' value={formData.fin_process_charge} readOnly/>
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell>
                          <FormInputSelect name='fin_elongshrink_opt' value={formData.fin_elongshrink_opt} options={[
                            {label:'Elongation %', value: 'elongation'},
                            {label:'Shrinkage %', value: 'shrinkage'},
                          ]} onChange={onRateChange} />
                        </TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='fin_elongshrink' value={formData.fin_elongshrink}
                            onChange={onRateChange} fullWidth />
                        </TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='fin_prod_elongshrink' value={formData.fin_prod_elongshrink} readOnly/>
                        </TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='fin_gray_elongshrink' value={formData.fin_gray_elongshrink} readOnly/>
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell>Wastage(%)</TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='fin_wastage' value={formData.fin_wastage}
                            onChange={onRateChange} fullWidth />
                        </TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='fin_prod_wastage' value={formData.fin_prod_wastage}
                            readOnly/>
                        </TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='fin_gray_wastage' value={formData.fin_gray_wastage}
                            readOnly/>
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell>Packing Charges(paise)</TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='fin_packing' value={formData.fin_packing}
                            onChange={onRateChange} fullWidth />
                        </TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='fin_packing' value={formData.fin_packing}
                            readOnly/>
                        </TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='fin_packing' value={formData.fin_packing}
                            readOnly/>
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell>Others(paise)</TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='fin_others' value={formData.fin_others}
                            onChange={onRateChange} fullWidth />
                        </TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='fin_others' value={formData.fin_others} readOnly/>
                        </TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='fin_others' value={formData.fin_others} readOnly/>
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell className={classes.borderTop}></TableLayoutCell>
                        <TableLayoutCell className={clsx(classes.borderTop, classes.alignRight)}>Total</TableLayoutCell>
                        <TableLayoutCell className={classes.borderTop}>
                          <FormInputText type="number" name='fin_prod_total' value={formData.fin_prod_total}
                            readOnly highlight />
                        </TableLayoutCell>
                        <TableLayoutCell className={classes.borderTop}>
                          <FormInputText type="number" name='fin_gray_total' value={formData.fin_gray_total}
                            readOnly highlight/>
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell></TableLayoutCell>
                        <TableLayoutCell></TableLayoutCell>
                        <TableLayoutCell>Profit(%)</TableLayoutCell>
                        <TableLayoutCell>Profit(%)</TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell style={{verticaAlign: 'bottom'}}>Finish Fabric Market Price</TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='fin_market_price' value={formData.fin_market_price}
                            onChange={onRateChange} fullWidth />
                        </TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='fin_prod_profit' value={formData.fin_prod_profit}
                            readOnly profit/>
                        </TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='fin_gray_profit' value={formData.fin_gray_profit}
                            readOnly profit/>
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
          </TabPanel>
          <TabPanel value={tabvalue} index={1}>
            Coming soon
          </TabPanel>
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
              <PrintField margin label="Lassa" value={formData.warp_lassa} />
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
              <PrintField label="Meter" value={formData.weft_meter} />
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
      <PrintField label="Gross rate" rs={true} value={formData.prod_cost} />
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