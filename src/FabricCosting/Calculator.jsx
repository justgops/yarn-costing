import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Card, CardContent, CardHeader, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, Grid, IconButton, makeStyles, OutlinedInput, Paper, Slide, Tab, Tabs, Typography, useTheme } from '@material-ui/core';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { connect } from 'react-redux';
import DataGrid, { TableLayout, TableLayoutCell, TableLayoutRow } from '../components/DataGrid';
import { NOTIFICATION_TYPE, setNotification } from '../store/reducers/notification';
import _ from 'lodash';
import { FormRowItem, FormInputText, FormRow, FormInputSelect, FormInfo, FormInputSelectSearch } from '../components/FormElements';
import DeleteForeverRoundedIcon from '@material-ui/icons/DeleteForeverRounded';
import CloseOutlinedIcon from '@material-ui/icons/CloseOutlined';
import ReactToPrint from 'react-to-print';
import { getSettings } from '../store/reducers/settings';
import clsx from 'clsx';
import TabPanel, { ButtonTab } from '../components/TabPanel';
import { LASSA_UNIT_OPTIONS } from '../Settings';
import axios from 'axios';
import { BASE_URL, getApi } from '../api';
import { getAxiosErr } from '../utils';

const ROUND_DECIMAL = 5;
const MARGIN_TABLE_MAX = 25;

function parse(num) {
  if(!isNaN(num) && num) {
    let ret = Number(num);
    return isFinite(ret) ? ret : Number(0.0);
  } else {
    return Number(0.0);
  }
}

function round(num) {
  num = parse(num);
  num = Math.round(num + "e" + ROUND_DECIMAL);
  return Number(num + "e" + -ROUND_DECIMAL);
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
        borderColor: 'transparent',
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
  },
  mtPerct: {
    width: '50px',
    padding: theme.spacing(1),
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
  return [round(prod_cost), breakup];
}

const getCalcReducer = (settings)=>(state, action)=>{
  const warpWeftReducer = (state)=>{

    state.total_weight_glm = round(state.warp_weight + state.weft_weight);
    state.total_weight_glm_wastage = round(state.warp_weight_wastage + state.weft_weight_wastage);
    state.total_weight_gsm = round((state.total_weight_glm * 39.37)/parse(state.warp_panna));
    [state.prod_cost, state.breakups.prod_cost] = getProdCostWithBreakup(state);
    for(let i=0; i<MARGIN_TABLE_MAX; i++) {
      state.margin_table[i] = round(state.prod_cost*(100+i+1)/100);
    }
    return state;
  }

  let warp_lassa_meter = parse(state.warp_lassa);
  let length_per_count = 1693.33;
  if(settings.lassa_unit == 'yard') {
    length_per_count = 1852;
    warp_lassa_meter = warp_lassa_meter*0.9144;
  }

  const warpPostReducer = (state, rowsChange=false)=>{
    state.warp_total_ends =  parse(state.warp_reed) * (parse(state.warp_panna) + parse(state.warp_reed_space));
    state.warp_cramp = round((warp_lassa_meter-parse(state.warp_ltol))/warp_lassa_meter*100);
    state.warp_weight = 0.0;
    state.warp_weight_wastage = 0.0;

    let gridValue = state['warps'];
    if(!gridValue) return state;

    let perct = (100/gridValue.length);

    for(let row of gridValue) {
      row.perct = rowsChange ? perct : row.perct;
      let count = parse(row.count);
      if(state.fabric_type == 'Denear') {
        count = 5315/count;
      }
      let weight =
        parse((state.warp_total_ends * parse(state.warp_lassa)/length_per_count/count/parse(state.warp_ltol))
          * parse(row.perct)/100);

      row.weight_wastage = weight + (parse(row.wastage) * weight)/100;
      state.warp_weight += weight;
      state.warp_weight_wastage += row.weight_wastage;

      let rate = parse(row.rate)*100/
        (100+(state.warp_rate_wgst ? parse(settings.yarn_rate_gst) : 0));
      let sizing_rate = parse(row.sizing_rate)*100/
        (100+(state.warp_sizing_wgst ? parse(settings.sizing_rate_gst) : 0));
      row.cost = row.weight_wastage * parse(rate);
      row.sizing_cost = row.weight_wastage * parse(sizing_rate);
    }

    state.warp_weight += state.warp_weight*parse(state.warp_iron_wt)/100;
    state.warp_weight = round(state.warp_weight);
    state.warp_weight_wastage = round(state.warp_weight_wastage);

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
      let count = parse(row.count);
      if(state.fabric_type == 'Denear') {
        count = 5315/count;
      }
      let weight =
        parse((parse(state.weft_meter) * (parse(state.weft_panna) + parse(state.weft_reed_space)) * parse(state.weft_pick)/(1693.33*count))
          *parse(row.perct)/100);

      row.weight_wastage = weight + (parse(row.wastage) * weight)/100;
      state.weft_weight += weight;
      state.weft_weight_wastage += row.weight_wastage;

      let rate = parse(row.rate)*100/
        (100+(state.weft_rate_wgst ? parse(settings.yarn_rate_gst) : 0));
      row.cost = row.weight_wastage * parse(rate);
    }
    state.weft_weight = round(state.weft_weight);
    state.weft_weight_wastage = round(state.weft_weight_wastage);
    return state;
  }

  const wpWarpReducer = (state)=>{
    let gridValue = state['wpWarps'];
    if(!gridValue) return state;

    for(let [i, row] of gridValue.entries()) {
      row.count = state.warps[i].count;
      let count = parse(row.count);
      if(state.fabric_type == 'Denear') {
        count = 5315/count;
      }
      row.kg_per_cone = parse(parse(row.bag_wt)/parse(row.bag_pack));
      row.cone_measure = parse(row.kg_per_cone*parse(count)*1693.33);
      row.tara = parse(state.warp_total_ends/parse(row.part));
      row.sizing_measure = row.cone_measure/parse(row.part)*parse(row.multipart);
      row.fabric_measure = parse(row.sizing_measure/warp_lassa_meter*parse(state.warp_ltol));
      row.total_warp_kg = parse(row.fabric_measure*state.warps[i].weight_wastage);
      row.warp_bags = row.total_warp_kg/parse(row.bag_wt);

      row.per_beam = parse(row.sizing_measure/parse(row.beams));
      if(i === 0) {
        state.wp_fabric_meter = round(row.fabric_measure);
      } else {
        state.wp_fabric_meter = 0;
      }
    }
    return state;
  }

  const wpWeftReducer = (state)=>{
    let gridValue = state['wpWefts'];
    if(!gridValue) return state;

    for(let [i, row] of gridValue.entries()) {
      row.count = state.wefts[i].count;
      row.total_weft_kg = state.wp_fabric_meter*state.wefts[i].weight_wastage;
      row.weft_bags = round(row.total_weft_kg/parse(row.bag_wt));
    }
    return state;
  }

  const rateReducer = (state)=>{
    /* Gray fabric */
    state.gray_brokerage_calc = parse(state.gray_market_price)*parse(state.gray_brokerage)/100;
    state.gray_interest_calc = state.prod_cost*parse(state.gray_interest)/100;
    state.gray_cashdisc_calc = parse(state.gray_market_price)*parse(state.gray_cashdisc)/100;
    state.gray_others_calc = state.prod_cost*parse(state.gray_others)/100;
    state.gray_total = round(state.prod_cost + state.gray_brokerage_calc + state.gray_interest_calc
      + state.gray_cashdisc_calc + state.gray_others_calc);

    state.gray_profit =  round((parse(state.gray_market_price)/state.gray_total-1)*100);
    let totalWarpCost = 0;
    let totalWarpSizCost = 0;
    let totalWeftCost = 0;
    for(let row of state['warps'] || []) {
      totalWarpCost += row.cost;
      totalWarpSizCost += row.sizing_cost;
    }
    for(let row of state['wefts'] || []) {
      totalWeftCost  += row.cost;
    }

    state.gray_revjobrate = round((parse(state.gray_market_price)-state.gray_brokerage_calc-state.gray_interest_calc
      -state.gray_cashdisc_calc-state.gray_others_calc-totalWarpCost-totalWarpSizCost-totalWeftCost)*100/parse(state.weft_pick));

    /* Finish fabric */
    state.fin_prod_elongshrink = state.prod_cost*parse(state.fin_elongshrink)/100;
    state.fin_gray_elongshrink = parse(state.fin_gray_price)*parse(state.fin_elongshrink)/100;

    state.fin_prod_wastage = (state.prod_cost+parse(state.fin_process_charge)+state.fin_prod_elongshrink)
      *parse(state.fin_wastage)/100;
    state.fin_gray_wastage = (parse(state.fin_gray_price)+parse(state.fin_process_charge)+state.fin_gray_elongshrink)
      *parse(state.fin_wastage)/100;

    let elongshrink = state.fin_elongshrink_opt === 'elongation' ? -1 : 1;
    state.fin_prod_total = round(state.prod_cost+parse(state.fin_process_charge)+elongshrink*state.fin_prod_elongshrink
      +state.fin_prod_wastage+parse(state.fin_packing)+parse(state.fin_others));
    state.fin_gray_total = round(parse(state.fin_gray_price)+parse(state.fin_process_charge)+elongshrink*state.fin_gray_elongshrink
      +state.fin_gray_wastage+parse(state.fin_packing)+parse(state.fin_others));

    state.fin_prod_profit = round((parse(state.fin_market_price)-state.fin_prod_total)/state.fin_prod_total*100);
    state.fin_gray_profit = round((parse(state.fin_market_price)-state.fin_gray_total)/state.fin_gray_total*100);

    state.fin_rev_gray_price = round(parse(state.fin_market_price)-parse(state.fin_process_charge)+elongshrink*state.fin_prod_elongshrink
      +state.fin_prod_wastage+parse(state.fin_packing)+parse(state.fin_others));
    return state;
  }

  let newState = _.cloneDeep(state);
  let rows = null;

  const processPostReducer = (postReducer, rowsChange)=>{
    if(postReducer == 'warp' || postReducer == 'all') {
      newState = warpPostReducer(newState, rowsChange);
    }
    if(postReducer == 'weft' || postReducer == 'all') {
      newState = weftPostReducer(newState, rowsChange);
    }
    if(postReducer == 'wpwarp' || postReducer == 'all') {
      newState = wpWarpReducer(newState);
    }
    if(postReducer == 'wpweft' || postReducer == 'all') {
      newState = wpWeftReducer(newState);
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

      if(action.depPath) {
        rows = _.get(newState, action.depPath, []);
        rows.push(action.depValue);
        _.set(newState, action.depPath, rows);
        processPostReducer(action.depPostReducer, true);
      }
      break;
    case 'remove_grid_row':
      rows = _.get(newState, action.path, []);
      rows.splice(action.value, 1);
      _.set(newState, action.path, rows);
      processPostReducer(action.postReducer, true);

      if(action.depPath) {
        rows = _.get(newState, action.depPath, []);
        rows.splice(action.depValue, 1);
        _.set(newState, action.depPath, rows);
        processPostReducer(action.depPostReducer, true);
      }
      break;
  }

  // if(action.postReducer) {
  newState = warpWeftReducer(newState);
  newState = rateReducer(newState);
  // }
  return newState;
}


function getGridCols(basePath, fieldsDispatch, postReducer, otherCols, cellClassName, depDetails={}, canDelete=true) {
  let baseCols = [{
    Header: '',
    id: 'id',
    Print: ({row})=>row.index+1,
    PrintFooter: '',
    Cell: ({row})=>{
      return <span style={{paddingLeft: '0.25rem', paddingRight: '0.25rem', fontWeight: 'bold'}}>{row.index+1}</span>;
    }
  },]

  if(canDelete) {
    baseCols.push({
      Header: '',
      id: 'btn-del',
      Cell: ({row})=>{
        return <IconButton onClick={(e)=>{
          e.preventDefault();
          fieldsDispatch({
            type: 'remove_grid_row',
            path: basePath,
            value: row.index,
            postReducer: postReducer,
            ...depDetails,
            depValue: row.index,
          });
        }}><DeleteForeverRoundedIcon /></IconButton>
      }
    });
  }

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
        total = round(total);
        return <FormInputText fullWidth inputProps={{style: {fontWeight: 'bold'}}} grid value={total} type="number" readOnly={true} />
      } : '',
      Cell: ({value, row, column})=>{
        value = col.CellValue ? col.CellValue(value) : value;
        let warn = col.warn ? col.warn(value): false;
        return (
          <FormInputText fullWidth type="number" value={value} readOnly={col.readOnly}
            onChange={(e)=>{
              let value = e.target.value;
              fieldsDispatch({
                type: 'set_value',
                path: basePath.concat([row.index, column.id]),
                value: value,
                postReducer: postReducer,
              });
            }}
            grid
            warn={warn} />
        )
      },
      default: col.default,
      warn: col.warn,
    });
  }

  return baseCols;
}

function SectionHead({children}) {
  return <Typography color="secondary" style={{textAlign: 'center', padding: '0.25rem', fontSize: '1.1rem'}}>{children}</Typography>;
}

function Calculator({open, onClose, selId, settings, agentOpts, partyOpts, ...props}) {
  const classes = useStyles();
  const apiObj = useMemo(()=>getApi(), []);

  const savedOtherData = useRef({});
  const [otherData, setOtherData] = useState({});
  const [fieldsData, fieldsDispatch] = useReducer(getCalcReducer(settings), {});
  const [formDataErr, setFormDataErr] = useState({});
  const editMode = !_.isNull(otherData.id) && !_.isUndefined(otherData.id);

  useEffect(async ()=>{
    let other = {};
    let data = {};
    try {
      if(selId) {
        let res = await apiObj.get(BASE_URL.QUALITY_DATA + '/' + selId);
        data = res.data.data;
        delete res.data.data;
        other = res.data;
        /* Sync up warp/weft packs if none */
        if(!data.wpWarps) {
          if(data.warps && data.warps.length > 0) {
            data.wpWarps = new Array(data.warps.length).fill(getDefaultRow(wpWarpCols));
          }
          if(data.wefts && data.wefts.length > 0) {
            data.wpWefts = new Array(data.wefts.length).fill(getDefaultRow(wpWeftCols));
          }
          data.margin_table = new Array(MARGIN_TABLE_MAX).fill(0);
        }
      }
      setOtherData(other);
      fieldsDispatch({
        type: 'init',
        value: {
          fin_elongshrink_opt: 'elongation',
          weft_insertion: 1,
          fabric_type: 'Cotton',
          ...data,
          weft_meter: 1,
          margin_table: new Array(MARGIN_TABLE_MAX).fill(0),
          breakups: {},
        },
      });
    } catch(err) {
      props.setNotification(NOTIFICATION_TYPE.ERROR, getAxiosErr(err));
    }
  }, [selId, open]);

  const onSave = (copy=false, close=false)=>{
    let method = 'POST', url = BASE_URL.QUALITIES;
    if(editMode && !copy) {
      method = 'PUT';
      url += '/' + otherData.id;
    }
    apiObj({
      method: method,
      url: url,
      data: {
        ...otherData,
        data: fieldsData,
      },
    }).then((res)=>{
      props.setNotification(NOTIFICATION_TYPE.SUCCESS, 'Quality saved successfully');
      savedOtherData.current = {...otherData};
      if(!editMode || copy) {
        savedOtherData.current.id = res.data;
        setOtherData(savedOtherData.current);
      }
      if(close) {
        onClose(savedOtherData.current);
      }
    }).catch((err)=>{
      props.setNotification(NOTIFICATION_TYPE.ERROR, getAxiosErr(err));
    });
  }

  const onOtherChange = useCallback((e, name) => {
    let value = e;
    if(e && e.target) {
      name = e.target.name;
      value = e.target.value;
    }

    setOtherData((prevData)=>({
      ...prevData,
      [name]: value,
    }));
  });

  const onWarpTextChange = useCallback((e, name) => {
    let value = e;
    if(e && e.target) {
      name = e.target.name;
      value = e.target.value;
    }

    fieldsDispatch({
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
    fieldsDispatch({
      type: 'set_value',
      path: name,
      value: value,
      postReducer: 'weft',
    });
  });

  const onWpWeftTextChange = useCallback((e, name) => {
    let value = e;
    if(e && e.target) {
      name = e.target.name;
      value = e.target.value;
    }
    fieldsDispatch({
      type: 'set_value',
      path: name,
      value: value,
      postReducer: 'wpweft',
    });
  });

  const onRateChange = useCallback((e, name) => {
    let value = e;
    if(e && e.target) {
      name = e.target.name;
      value = e.target.value;
    }
    fieldsDispatch({
      type: 'set_value',
      path: name,
      value: value,
    });
  });

  const warpCols = useMemo(()=>getGridCols(['warps'], fieldsDispatch, 'warp', [
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
      Header: ()=>{
        return (
        <>
        Rate(Rs per Kg)
        <FormControlLabel
          control={
            <Checkbox
              color="primary"
              size="small"
              checked={fieldsData.warp_rate_wgst}
              onChange={(e)=>{
                onWarpTextChange(e.target.checked, 'warp_rate_wgst')
              }}
            />
          }
          label="w/GST"
        />
        </>
        )
      },
      accessor: 'rate',
    },
    {
      Header: ()=>{
        return (
        <>
        Sizing rate(Rs per Kg)
        <FormControlLabel
          control={
            <Checkbox
              color="primary"
              size="small"
              checked={fieldsData.warp_sizing_wgst}
              onChange={(e)=>{
                onWarpTextChange(e.target.checked, 'warp_sizing_wgst')
              }}
            />
          }
          label="w/GST"
        />
        </>
        )
      },
      accessor: 'sizing_rate',
      Footer: 'check;',
      GST: true,
    },
    {
      Header: 'Weight w/wastage(Kg)',
      accessor: 'weight_wastage',
      readOnly: true,
      showTotal: true,
      CellValue: (value)=>round(value),
    },
    {
      Header: 'Warp cost(Rs)',
      accessor: 'cost',
      readOnly: true,
      showTotal: true,
      CellValue: (value)=>round(value),
    },
    {
      Header: 'Warp sizing cost(Rs)',
      accessor: 'sizing_cost',
      readOnly: true,
      showTotal: true,
      CellValue: (value)=>round(value),
    },
  ], classes.gridCell, {
    depPath: 'wpWarps',
    depPostReducer: 'wpwarp',
  }), [fieldsData.warp_sizing_wgst, fieldsData.warp_rate_wgst]);

  const weftCols = useMemo(()=>getGridCols(['wefts'], fieldsDispatch, 'weft',[
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
      Header: ()=>{
        return (
        <>
        Rate(Rs per Kg)
        <FormControlLabel
          control={
            <Checkbox
              color="primary"
              size="small"
              checked={fieldsData.weft_rate_wgst}
              onChange={(e)=>{
                onWeftTextChange(e.target.checked, 'weft_rate_wgst')
              }}
            />
          }
          label="w/GST"
        />
        </>
        )
      },
      accessor: 'rate',
    },
    {
      Header: 'Weight w/wastage(Kg)',
      accessor: 'weight_wastage',
      readOnly: true,
      showTotal: true,
      CellValue: (value)=>round(value),
    },
    {
      Header: 'Weft cost(Rs)',
      accessor: 'cost',
      readOnly: true,
      showTotal: true,
      CellValue: (value)=>round(value),
    },
  ], classes.gridCell, {
    depPath: 'wpWefts',
    depPostReducer: 'wpweft',
  }), [fieldsData.weft_rate_wgst]);

  const wpWarpCols = useMemo(()=>getGridCols(['wpWarps'], fieldsDispatch, 'wpwarp',[
    {
      Header: 'Warp Count',
      accessor: 'count',
      readOnly: true,
    },
    {
      Header: 'Bag Wt.',
      accessor: 'bag_wt',
    },
    {
      Header: 'Bag Packing',
      accessor: 'bag_pack',
    },
    {
      Header: 'Kg/Cone',
      accessor: 'kg_per_cone',
      readOnly: true,
      CellValue: (value)=>round(value),
    },
    {
      Header: 'Cone Measure',
      accessor: 'cone_measure',
      readOnly: true,
      CellValue: (value)=>round(value),
    },
    {
      Header: 'Part',
      accessor: 'part',
    },
    {
      Header: 'Multi-Part',
      accessor: 'multipart',
      default: 1,
      warn: (value)=>(value != 1),
    },
    {
      Header: 'Tara',
      accessor: 'tara',
      readOnly: true,
      CellValue: (value)=>round(value),
    },
    {
      Header: 'Sizing Measure',
      accessor: 'sizing_measure',
      readOnly: true,
      CellValue: (value)=>round(value),
    },
    {
      Header: 'Fabric Measure',
      accessor: 'fabric_measure',
      readOnly: true,
      CellValue: (value)=>round(value),
    },
    {
      Header: 'Warp Bags',
      accessor: 'warp_bags',
      readOnly: true,
      CellValue: (value)=>round(value),
    },
    {
      Header: 'Total Warp(Kg)',
      accessor: 'total_warp_kg',
      readOnly: true,
      CellValue: (value)=>round(value),
    },
    {
      Header: 'No of Beams',
      accessor: 'beams',
    },
    {
      Header: 'Per Beam',
      accessor: 'per_beam',
      readOnly: true,
      CellValue: (value)=>round(value),
    },
  ], classes.gridCell, {}, false), []);

  const wpWeftCols = useMemo(()=>getGridCols(['wpWefts'], fieldsDispatch, 'wpweft',[
    {
      Header: 'Weft Count',
      accessor: 'count',
      readOnly: true,
    },
    {
      Header: 'Bag Wt.',
      accessor: 'bag_wt',
    },
    {
      Header: 'Bag Packing',
      accessor: 'bag_pack',
    },
    {
      Header: 'Weft Bags',
      accessor: 'weft_bags',
      readOnly: true,
      CellValue: (value)=>round(value),
    },
    {
      Header: 'Total Weft(Kg)',
      accessor: 'total_weft_kg',
      readOnly: true,
      CellValue: (value)=>round(value),
    },
  ], classes.gridCell, {}, false), []);

  const getDefaultRow = (cols) => {
    let row = {}
    cols.forEach((col)=>{
      if(col.id?.startsWith('btn') || _.isUndefined(col.accessor)) {
        return;
      }
      row[col.accessor] = !_.isUndefined(col.default) ? col.default : 0;
    });
    return row;
  }

  const reportRef = useRef()
  const theme = useTheme();
  const marginTableRows = Math.ceil((fieldsData.margin_table||[]).length/3);
  const [tabvalue, setTabvalue] = React.useState(0);

  const tabChange = (event, newValue) => {
    newValue!=null && setTabvalue(newValue);
  };

  return (
    <Dialog disableEscapeKeyDown open={open} fullScreen scroll='paper' TransitionProps={{
      enter: false,
      exit: false,
    }}>
      <DialogTitle id="simple-dialog-title">
        <IconButton onClick={()=>onClose(savedOtherData.current)} style={{marginRight: '0.5rem'}}><CloseOutlinedIcon /></IconButton>
        {editMode ? 'Update quality' : 'Add new quality'}
      </DialogTitle>
      <DialogContent dividers={true}>
        <FormRow>
          <FormRowItem>
            <FormInputText autoFocus label="Name" name='name' value={otherData.name}
              errorMsg={formDataErr.name} onChange={onOtherChange} />
          </FormRowItem>
          <FormRowItem>
            <FormInputSelectSearch label="Agent" name='agentId' options={agentOpts} isClearable={true}
              value={_.find(agentOpts, (e)=>e.value == otherData.agentId)}
              errorMsg={formDataErr.agentId}
              onChange={(value)=>{
                onOtherChange(value?.value, 'agentId');
              }}
            />
          </FormRowItem>
          <FormRowItem>
            <FormInputSelectSearch label="Party" name='partyId' options={partyOpts} isClearable={true}
              value={_.find(partyOpts, (e)=>e.value == otherData.partyId)}
              errorMsg={formDataErr.partyId}
              onChange={(value)=>{
                onOtherChange(value?.value, 'partyId');
              }}
            />
          </FormRowItem>
          <FormRowItem>
            <FormInputText label="Notes" name='notes' value={otherData.notes}
              errorMsg={formDataErr.notes} onChange={onOtherChange} />
          </FormRowItem>
        </FormRow>
        <Box display="flex" flexDirection="column" height="100%" style={{minHeight: 0}}>
          <ToggleButtonGroup size="small" value={tabvalue} exclusive onChange={tabChange}>
            <ToggleButton value={0}>
              Gray fabric
            </ToggleButton>
            <ToggleButton value={1}>
              Finish fabric
            </ToggleButton>
            <ToggleButton value={2}>
              Packing
            </ToggleButton>
          </ToggleButtonGroup>
          <TabPanel value={tabvalue} index={0}>
            <Grid container spacing={1}>
              <Grid item sm={6} md={3} lg={3} xl={10}>
                <FormInputSelect name='fabric_type' value={fieldsData.fabric_type} options={[
                    {label:'Cotton', value: 'Cotton'},
                    {label:'Polyster', value: 'Polyster'},
                    {label:'Denear', value: 'Denear'},
                  ]} onChange={onWarpTextChange}
                />
              </Grid>
            </Grid>
            <Grid container spacing={1}>
              <Grid item sm={12} md={12} lg={10} xl={10}>
                <Paper style={{height: '100%'}}>
                  <SectionHead>Warp</SectionHead>
                  <Divider />
                  <Box style={{padding: '0.5rem'}}>
                    <FormRow>
                      <FormRowItem>
                        <FormInputText type="number" label="EPI/Reed(Inch)" name='warp_reed' value={fieldsData.warp_reed}
                          errorMsg={formDataErr.warp_reed} onChange={onWarpTextChange} fullWidth/>
                      </FormRowItem>
                      <FormRowItem>
                        <FormInputText type="number" label="Width/Panna(Inch)" name='warp_panna' value={fieldsData.warp_panna}
                          errorMsg={formDataErr.warp_panna} onChange={onWarpTextChange} />
                      </FormRowItem>
                      <FormRowItem>
                        <FormInputText type="number" label="Extra Reed Space(Inch)" name='warp_reed_space' value={fieldsData.warp_reed_space}
                          errorMsg={formDataErr.warp_reed_space} onChange={onWarpTextChange} />
                      </FormRowItem>
                      <FormRowItem>
                        <FormInputText type="number" label={`Cut Mark/Lassa (${(_.find(LASSA_UNIT_OPTIONS, (o)=>o.value==settings.lassa_unit)||{label: ''}).label})`} name='warp_lassa' value={fieldsData.warp_lassa}
                          errorMsg={formDataErr.warp_lassa} onChange={onWarpTextChange} />
                      </FormRowItem>
                      <FormRowItem>
                        <FormInputText type="number" label="Cut Length/L to L(Meter)" name='warp_ltol' value={fieldsData.warp_ltol}
                          errorMsg={formDataErr.warp_ltol} onChange={onWarpTextChange} />
                      </FormRowItem>
                      <FormRowItem>
                        <FormInputText type="number" label="Ironing/Sizing Wt. increase(%)" name='warp_iron_wt' value={fieldsData.warp_iron_wt}
                          errorMsg={formDataErr.warp_iron_wt} onChange={onWarpTextChange} />
                      </FormRowItem>
                      <FormRowItem>
                        <FormInputText type="number" label="Cramp(%)" name='warp_cramp' value={fieldsData.warp_cramp}
                          errorMsg={formDataErr.warp_cramp} onChange={onWarpTextChange} readOnly/>
                      </FormRowItem>
                      <FormRowItem>
                        <FormInputText type="number" label="Total ends" name='warp_total_ends' value={round(fieldsData.warp_total_ends)}
                          readOnly />
                      </FormRowItem>
                    </FormRow>
                  </Box>
                  <DataGrid columns={warpCols} data={fieldsData.warps || []} showFooter={true} tdClassName={classes.inputGridTd}
                    noRowsMessage="Click on Add warp"/>
                  <Button variant="outlined" color="primary" onClick={()=>{
                    fieldsDispatch({
                      type: 'add_grid_row',
                      path: 'warps',
                      value: getDefaultRow(warpCols),
                      postReducer: 'warp',
                      depPath: 'wpWarps',
                      depPostReducer: 'wpwarp',
                      depValue: getDefaultRow(wpWarpCols),
                    });
                  }}>Add warp</Button>
                  <Divider style={{marginTop: '0.5rem'}} />
                  <SectionHead>Weft</SectionHead>
                  <Divider />
                  <Box style={{padding: '0.5rem'}}>
                    <FormRow>
                      <FormRowItem>
                        <FormInputText type="number" label="Meter" name='weft_meter' value={fieldsData.weft_meter}
                          errorMsg={formDataErr.weft_meter} readOnly/>
                      </FormRowItem>
                      <FormRowItem>
                        <FormInputText type="number" label="Width/Panna(Inch)" name='weft_panna' value={fieldsData.weft_panna}
                          errorMsg={formDataErr.panna} onChange={onWeftTextChange} />
                      </FormRowItem>
                      <FormRowItem>
                        <FormInputText type="number" label="Exta Reed Space(Inch)" name='weft_reed_space' value={fieldsData.weft_reed_space}
                          errorMsg={formDataErr.reed_space} onChange={onWeftTextChange} />
                      </FormRowItem>
                      <FormRowItem>
                        <FormInputText type="number" label="PPI(Pick)" name='weft_pick' value={fieldsData.weft_pick}
                          errorMsg={formDataErr.weft_pick} onChange={onWeftTextChange} />
                      </FormRowItem>
                      <FormRowItem>
                        <FormInputText type="number" label="No. of insertion" name='weft_insertion' value={fieldsData.weft_insertion}
                          errorMsg={formDataErr.weft_insertion} onChange={onWeftTextChange} warn={fieldsData.weft_insertion != 1}/>
                      </FormRowItem>
                      <FormRowItem>
                        <FormInputText type="number" label="Job Rate(paise)" name='weft_job_rate' value={fieldsData.weft_job_rate}
                          errorMsg={formDataErr.weft_job_rate} onChange={onWeftTextChange} />
                      </FormRowItem>
                      <FormRowItem>
                        <FormInputText type="number" label="Weaving charges" name='weaving_charges' value={fieldsData.weaving_charges}
                          readOnly />
                      </FormRowItem>
                    </FormRow>
                  </Box>
                  <DataGrid columns={weftCols} data={fieldsData.wefts || []} showFooter={true} tdClassName={classes.inputGridTd}
                    noRowsMessage="Click on Add weft"/>
                  <Button variant="outlined" color="primary" onClick={()=>{
                    fieldsDispatch({
                      type: 'add_grid_row',
                      path: 'wefts',
                      value: getDefaultRow(weftCols),
                      postReducer: 'weft',
                      depPath: 'wpWefts',
                      depPostReducer: 'wpweft',
                      depValue: getDefaultRow(wpWeftCols),
                    });
                  }}>Add weft</Button>
                </Paper>
              </Grid>
              <Grid item sm={12} md={12} lg={2} xl={2}>
                <Paper style={{height: '100%'}}>
                  <SectionHead>Summary(Kg)</SectionHead>
                  <Divider />
                  <Box style={{padding: '0.5rem'}}>
                    <FormInputText type="number" label="Warp weight" name='warp_weight' value={fieldsData.warp_weight} readOnly />
                    <Box style={{marginTop: '0.5rem'}}>
                      <FormInputText type="number" label="Weft weight" name='weft_weight'
                        value={fieldsData.weft_weight} readOnly />
                    </Box>
                    <Box style={{marginTop: '0.5rem'}}>
                      <FormInputText type="number" label="Total weight (GLM)" name='total_weight_glm'
                        value={fieldsData.total_weight_glm} readOnly highlight/>
                    </Box>
                    <Box style={{marginTop: '0.5rem'}}>
                      <FormInputText type="number" label="Total weight (GSM)" name='total_weight_gsm'
                        value={fieldsData.total_weight_gsm} readOnly highlight/>
                    </Box>
                    <Box style={{marginTop: '0.5rem'}}>
                      <FormInputText type="number" label="Warp weight w/wastage" name='warp_weight_wastage'
                        value={fieldsData.warp_weight_wastage} readOnly />
                    </Box>
                    <Box style={{marginTop: '0.5rem'}}>
                      <FormInputText type="number" label="Weft weight w/wastage" name='weft_weight_wastage'
                        value={fieldsData.weft_weight_wastage} readOnly />
                    </Box>
                    <Box style={{marginTop: '0.5rem'}}>
                      <FormInputText type="number" label="Total weight w/wastage" name='total_weight_glm_wastage'
                        value={fieldsData.total_weight_glm_wastage} readOnly highlight/>
                    </Box>
                    <Box style={{marginTop: '0.5rem'}}>
                      <FormInputText type="number" label="Production Cost" name='prod_cost'
                        value={fieldsData.prod_cost} readOnly highlight/>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
            <Paper style={{marginTop: '0.5rem'}}>
              <SectionHead>Cost breakup</SectionHead>
              <Divider />
              <Box style={{padding: '0.5rem'}}>
                <Grid container spacing={1}>
                  <Grid item md={4} sm={12} xs={12}>
                    <TableLayout>
                      <TableLayoutRow>
                        <TableLayoutCell colSpan={4} className={classes.borderBottom} style={{textAlign: 'center'}}>
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
                                {fieldsData.breakups?.prod_cost && Object.keys(fieldsData.breakups.prod_cost).map((b)=>{
                                  return (
                                    <TableLayoutRow key={b}>
                                      <TableLayoutCell>{b}</TableLayoutCell>
                                      <TableLayoutCell>{fieldsData.breakups.prod_cost[b]}</TableLayoutCell>
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
                          <FormInputText type="number" name='prod_cost' value={fieldsData.prod_cost}
                            readOnly />
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell>Gray market price</TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='gray_market_price' value={fieldsData.gray_market_price}
                            onChange={onRateChange} />
                        </TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='gray_market_price' value={fieldsData.gray_market_price} readOnly />
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell>Brokerage(%)</TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='gray_brokerage' value={fieldsData.gray_brokerage}
                            onChange={onRateChange} />
                        </TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='gray_brokerage_calc' value={fieldsData.gray_brokerage_calc} readOnly />
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell>Interest(%)</TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='gray_interest' value={fieldsData.gray_interest}
                            onChange={onRateChange} />
                        </TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='gray_interest_calc' value={fieldsData.gray_interest_calc} readOnly />
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell>Cash discount(%)</TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='gray_cashdisc' value={fieldsData.gray_cashdisc}
                            onChange={onRateChange} />
                        </TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='gray_cashdisc_calc' value={fieldsData.gray_cashdisc_calc} readOnly />
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell>Others(%)</TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='gray_others' value={fieldsData.gray_others}
                            onChange={onRateChange} />
                        </TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='gray_others_calc' value={fieldsData.gray_others_calc} readOnly />
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell className={classes.borderTop}></TableLayoutCell>
                        <TableLayoutCell className={clsx(classes.borderTop, classes.alignRight)}>Total</TableLayoutCell>
                        <TableLayoutCell className={classes.borderTop}>
                          <FormInputText type="number" name='gray_total' value={fieldsData.gray_total} readOnly highlight/>
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell></TableLayoutCell>
                        <TableLayoutCell className={classes.alignRight}>Profit(%)</TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='gray_profit' value={fieldsData.gray_profit} readOnly profit/>
                        </TableLayoutCell>
                      </TableLayoutRow>
                      <TableLayoutRow>
                        <TableLayoutCell></TableLayoutCell>
                        <TableLayoutCell className={classes.alignRight}>Reverse Job Rate(Paise)</TableLayoutCell>
                        <TableLayoutCell>
                          <FormInputText type="number" name='gray_revjobrate' value={fieldsData.gray_revjobrate} readOnly highlight/>
                        </TableLayoutCell>
                      </TableLayoutRow>
                    </TableLayout>
                  </Grid>
                  <Grid item md={1} sm={12} xs={12}></Grid>
                  <Grid item md={7} sm={12} xs={12}>
                    <TableLayout>
                      <TableLayoutRow>
                        <TableLayoutCell colSpan={99} className={classes.borderBottom} style={{textAlign: 'center'}}>
                          <Typography color="secondary">Margin Table</Typography>
                        </TableLayoutCell>
                      </TableLayoutRow>
                      {[...new Array(marginTableRows)].map((v, irow)=>{
                        let mt = fieldsData.margin_table || [];
                        return (
                          <TableLayoutRow key={irow}>
                            <TableLayoutCell className={classes.mtPerct}>{0+irow+1}%</TableLayoutCell>
                            <TableLayoutCell>{mt[0+irow]}</TableLayoutCell>
                            {marginTableRows+irow < mt.length && <>
                            <TableLayoutCell className={classes.mtPerct}>{marginTableRows+irow+1}%</TableLayoutCell>
                            <TableLayoutCell>{mt[marginTableRows+irow]}</TableLayoutCell>
                            </>}
                            {2*marginTableRows+irow < mt.length && <>
                            <TableLayoutCell className={classes.mtPerct}>{2*marginTableRows+irow+1}%</TableLayoutCell>
                            <TableLayoutCell>{mt[2*marginTableRows+irow]}</TableLayoutCell>
                            </>}
                          </TableLayoutRow>
                        )
                      })}
                    </TableLayout>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </TabPanel>
          <TabPanel value={tabvalue} index={1}>
            <Box style={{padding: '0.5rem'}}>
              <Grid container spacing={1}>
                <Grid item md={7} sm={12} xs={12}>
                  <TableLayout>
                    <TableLayoutRow>
                      <TableLayoutCell colSpan={4} className={classes.borderBottom} style={{textAlign: 'center'}}>
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
                        <FormInputText type="number" name='prod_cost' value={fieldsData.prod_cost}
                          readOnly/>
                      </TableLayoutCell>
                      <TableLayoutCell className={classes.borderBottom}>
                        <FormInputText type="number" name='fin_gray_price' value={fieldsData.fin_gray_price}
                          onChange={onRateChange} />
                      </TableLayoutCell>
                    </TableLayoutRow>
                    <TableLayoutRow>
                      <TableLayoutCell>Process Charge(Rs.)</TableLayoutCell>
                      <TableLayoutCell>
                        <FormInputText type="number" name='fin_process_charge' value={fieldsData.fin_process_charge}
                          onChange={onRateChange} />
                      </TableLayoutCell>
                      <TableLayoutCell>
                        <FormInputText type="number" name='fin_process_charge' value={fieldsData.fin_process_charge} readOnly/>
                      </TableLayoutCell>
                      <TableLayoutCell>
                        <FormInputText type="number" name='fin_process_charge' value={fieldsData.fin_process_charge} readOnly/>
                      </TableLayoutCell>
                    </TableLayoutRow>
                    <TableLayoutRow>
                      <TableLayoutCell>
                        <FormInputSelect name='fin_elongshrink_opt' value={fieldsData.fin_elongshrink_opt} options={[
                          {label:'Elongation %', value: 'elongation'},
                          {label:'Shrinkage %', value: 'shrinkage'},
                        ]} onChange={onRateChange} />
                      </TableLayoutCell>
                      <TableLayoutCell>
                        <FormInputText type="number" name='fin_elongshrink' value={fieldsData.fin_elongshrink}
                          onChange={onRateChange} fullWidth />
                      </TableLayoutCell>
                      <TableLayoutCell>
                        <FormInputText type="number" name='fin_prod_elongshrink' value={fieldsData.fin_prod_elongshrink} readOnly/>
                      </TableLayoutCell>
                      <TableLayoutCell>
                        <FormInputText type="number" name='fin_gray_elongshrink' value={fieldsData.fin_gray_elongshrink} readOnly/>
                      </TableLayoutCell>
                    </TableLayoutRow>
                    <TableLayoutRow>
                      <TableLayoutCell>Wastage(%)</TableLayoutCell>
                      <TableLayoutCell>
                        <FormInputText type="number" name='fin_wastage' value={fieldsData.fin_wastage}
                          onChange={onRateChange} fullWidth />
                      </TableLayoutCell>
                      <TableLayoutCell>
                        <FormInputText type="number" name='fin_prod_wastage' value={fieldsData.fin_prod_wastage}
                          readOnly/>
                      </TableLayoutCell>
                      <TableLayoutCell>
                        <FormInputText type="number" name='fin_gray_wastage' value={fieldsData.fin_gray_wastage}
                          readOnly/>
                      </TableLayoutCell>
                    </TableLayoutRow>
                    <TableLayoutRow>
                      <TableLayoutCell>Packing Charges(Rs)</TableLayoutCell>
                      <TableLayoutCell>
                        <FormInputText type="number" name='fin_packing' value={fieldsData.fin_packing}
                          onChange={onRateChange} fullWidth />
                      </TableLayoutCell>
                      <TableLayoutCell>
                        <FormInputText type="number" name='fin_packing' value={fieldsData.fin_packing}
                          readOnly/>
                      </TableLayoutCell>
                      <TableLayoutCell>
                        <FormInputText type="number" name='fin_packing' value={fieldsData.fin_packing}
                          readOnly/>
                      </TableLayoutCell>
                    </TableLayoutRow>
                    <TableLayoutRow>
                      <TableLayoutCell>Others(Rs)</TableLayoutCell>
                      <TableLayoutCell>
                        <FormInputText type="number" name='fin_others' value={fieldsData.fin_others}
                          onChange={onRateChange} fullWidth />
                      </TableLayoutCell>
                      <TableLayoutCell>
                        <FormInputText type="number" name='fin_others' value={fieldsData.fin_others} readOnly/>
                      </TableLayoutCell>
                      <TableLayoutCell>
                        <FormInputText type="number" name='fin_others' value={fieldsData.fin_others} readOnly/>
                      </TableLayoutCell>
                    </TableLayoutRow>
                    <TableLayoutRow>
                      <TableLayoutCell className={classes.borderTop}></TableLayoutCell>
                      <TableLayoutCell className={clsx(classes.borderTop, classes.alignRight)}>Total</TableLayoutCell>
                      <TableLayoutCell className={classes.borderTop}>
                        <FormInputText type="number" name='fin_prod_total' value={fieldsData.fin_prod_total}
                          readOnly highlight />
                      </TableLayoutCell>
                      <TableLayoutCell className={classes.borderTop}>
                        <FormInputText type="number" name='fin_gray_total' value={fieldsData.fin_gray_total}
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
                      <TableLayoutCell>Finish Fabric Market Price</TableLayoutCell>
                      <TableLayoutCell>
                        <FormInputText type="number" name='fin_market_price' value={fieldsData.fin_market_price}
                          onChange={onRateChange} fullWidth />
                      </TableLayoutCell>
                      <TableLayoutCell>
                        <FormInputText type="number" name='fin_prod_profit' value={fieldsData.fin_prod_profit}
                          readOnly profit/>
                      </TableLayoutCell>
                      <TableLayoutCell>
                        <FormInputText type="number" name='fin_gray_profit' value={fieldsData.fin_gray_profit}
                          readOnly profit/>
                      </TableLayoutCell>
                    </TableLayoutRow>
                    <TableLayoutRow>
                      <TableLayoutCell>Reverse Gray Market Price</TableLayoutCell>
                      <TableLayoutCell>
                        <FormInputText type="number" name='fin_rev_gray_price' value={fieldsData.fin_rev_gray_price} readOnly/>
                      </TableLayoutCell>
                      <TableLayoutCell></TableLayoutCell>
                      <TableLayoutCell></TableLayoutCell>
                    </TableLayoutRow>
                  </TableLayout>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>
          <TabPanel value={tabvalue} index={2}>
            <Paper style={{height: '100%'}}>
              <SectionHead>Warp required</SectionHead>
              <Divider />
              <DataGrid columns={wpWarpCols} data={fieldsData.wpWarps || []} tdClassName={classes.inputGridTd} />
              <SectionHead>Weft required</SectionHead>
              <Divider />
              <Box style={{padding: '0.5rem'}}>
                <FormRow>
                  <FormRowItem>
                    <FormInputText type="number" label="Fabric Meter" name='wp_fabric_meter' value={fieldsData.wp_fabric_meter}
                      onChange={onWpWeftTextChange}/>
                  </FormRowItem>
                  <FormRowItem></FormRowItem>
                  <FormRowItem></FormRowItem>
                  <FormRowItem></FormRowItem>
                  <FormRowItem></FormRowItem>
                  <FormRowItem></FormRowItem>
                </FormRow>
              </Box>
              <DataGrid columns={wpWeftCols} data={fieldsData.wpWefts || []} tdClassName={classes.inputGridTd} />
            </Paper>
          </TabPanel>
        </Box>
        <Box display="none">
          <PrintPage fieldsData={fieldsData} printRef={reportRef} warpCols={warpCols} weftCols={weftCols}/>
        </Box>

      </DialogContent>
      <DialogActions style={{justifyContent: 'flex-start'}}>
        <Button variant="contained" onClick={()=>onSave()} color="primary" disabled={!Boolean(otherData.name)}>Save</Button>
        <Button variant="contained" onClick={()=>onSave(true)} color="primary" disabled={!Boolean(otherData.name) || !Boolean(otherData.id)}>Copy and Save</Button>
        <Button variant="contained" onClick={()=>onSave(false, true)} color="primary" disabled={!Boolean(otherData.name)}>Save and Close</Button>
        <ReactToPrint
          trigger={()=><Button color="primary" variant="outlined" style={{marginLeft: '0.5rem'}}>Print</Button>}
          content={()=>reportRef.current}
          pageStyle={pageStyle}
          documentTitle={'Costing-'+fieldsData.name}
        />
        {/* <Button variant="outlined" color="primary" style={{marginLeft: '0.5rem'}} disabled>Print(Coming soon)</Button> */}
        <Button variant="outlined" color="primary" onClick={()=>onClose(savedOtherData.current)} style={{marginLeft: '0.5rem'}}>Close</Button>
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

function PrintPage({printRef, fieldsData, warpCols, weftCols}) {
  const classes = useReportStyles();
  return (
    <Box ref={printRef} className={classes.page}>
      <Box textAlign="center">
        <h3>Fabric Costing</h3>
      </Box>
      {/* <Divider /> */}
      <Box borderTop={1}/>
      <Box p={1}>
        <PrintField label="Quality Name" value={fieldsData.name} />
      </Box>
      <Box borderTop={1}/>
      <Grid container>
        <Grid item xs={12}>
          <Box>
            <Box textAlign="center">
              <h3>Warp</h3>
            </Box>
            <Box display="flex" flexWrap="wrap">
              <PrintField label="Reed Name" value={fieldsData.warp_reed} />
              <PrintField margin label="Panna" value={fieldsData.warp_panna} />
              <PrintField margin label="Reed space" value={fieldsData.warp_reed_space} />
              <PrintField margin label="Lassa" value={fieldsData.warp_lassa} />
              <PrintField margin label="L to L" value={fieldsData.warp_ltol} />
              <PrintField margin label="Total ends" value={fieldsData.warp_total_ends} />
            </Box>
            <DataGrid columns={warpCols} data={fieldsData.warps || []} showFooter={true} print={true}/>
          </Box>
          <Box>
            <Box textAlign="center">
              <h3>Weft</h3>
            </Box>
            <Box display="flex" flexWrap="wrap">
              <PrintField label="Meter" value={fieldsData.weft_meter} />
              <PrintField margin label="Panna" value={fieldsData.weft_panna} />
              <PrintField margin label="Reed space" value={fieldsData.weft_reed_space} />
              <PrintField margin label="Pick" value={fieldsData.weft_pick} />
              <PrintField margin label="Job rate (paise)" value={fieldsData.weft_job_rate} />
              <PrintField margin label="Weaving charges" value={fieldsData.weaving_charges} />
            </Box>
            <DataGrid columns={weftCols} data={fieldsData.wefts || []} showFooter={true} print={true}/>
          </Box>
        </Grid>
      </Grid>
      <Divider />
      <PrintField label="Gross rate" rs={true} value={fieldsData.prod_cost} />
      <PrintField label="Rate local" rs={true} value={fieldsData.rate_local_rs} />
      <PrintField label="Rate out" rs={true} value={fieldsData.rate_out_rs} />
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