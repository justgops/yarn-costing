import { Box, Button, Divider, Grid, makeStyles } from '@material-ui/core';
import _ from 'lodash';
import React, { useCallback, useMemo, useReducer, useState } from 'react';
import DataGrid from '../components/DataGrid';
import { FormInputText, FormRow, FormRowItem } from '../components/FormElements';

function chartReducer(state, action) {
  let newState = _.clone(state);
  switch (action.type) {
    case 'add_count':
      newState.push({
        count: action.value,
        rates: {}
      });
      break;
    default:
      break;
  }
  return newState;
}

// {
//   count: 30,
//   rates: {
//     [JSON.stringify([8501, 9500])]: 25,
//     [JSON.stringify([6501, 8500])]: 22,
//   }
// },{
//   count: 40,
//   rates: {
//     [JSON.stringify([8501, 9500])]: 24,
//   }
// },

const useStyles = makeStyles(()=>({
  inputGridTd: {
    padding: '0px',
  },
}));

export function CountChart() {
  const classes = useStyles();
  const [formData, setFormData] = useState({});
  const [chartRanges, setChartRanges] = useState([
    [6501, 8500],
    [8501, 9500]
  ]);
  const [chartData, chartDataDispatch] = useReducer(chartReducer, [
    {
      count: 30,
      rates: {
        [JSON.stringify([8501, 9500])]: 25,
        [JSON.stringify([6501, 8500])]: 22,
      }
    },{
      count: 40,
      rates: {
        [JSON.stringify([8501, 9500])]: 24,
      }
    },
  ]);

  const chartCols = useMemo(()=>[
    {
      Header: 'Count',
      accessor: 'count',
      Cell: ({value})=>{
        return (
          <FormInputText fullWidth type="number" value={value} readOnly grid />
        )
      },
    },
    ...chartRanges.map((range, i)=>({
      Header: ()=>{
        return (
          <>
          <Box>{range[0]}</Box>
          <Divider />
          <Box>{range[1]}</Box>
          </>
        );
      },
      id: JSON.stringify(range) + i,
      accessor: (row)=>{
        return row.rates[JSON.stringify(range)] || 0;
      },
      Cell: ({value, row, column})=>{
        return (
          <FormInputText fullWidth type="number" value={value}
            onChange={(e)=>{
              let value = e.target.value;
              chartDataDispatch({
                type: 'set_value',
                // path: basePath.concat([row.index, column.id]),
                value: value,
              });
            }}
            grid />
        )
      },
    })),
  ], [chartRanges?.length]);

  const addEndsClick = ()=>{
    setChartRanges((prevRanges)=>{
      return [
        ...prevRanges,
        [formData.rangeFrom, formData.rangeTo],
      ]
    });
  }

  const addCountClick = ()=>{
    chartDataDispatch({
      type: 'add_count',
      // path: basePath.concat([row.index, column.id]),
      value: formData.count,
    });
    setFormData((prev)=>({...prev, count: null}));
  }

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

  return (
    <>
      <Box p="1"></Box>
      <Box width="100%" overflow="auto">
        <DataGrid columns={chartCols} data={chartData} filterObj={[]} tdClassName={classes.inputGridTd} fixedLayout/>
      </Box>
      <Grid container>
        <Grid item lg={4} md={6} sm={12} xs={12}>
          <FormRow>
            <FormRowItem>
              <FormInputText label="Count" name="count" type="number" value={formData.count} onChange={onTextChange} />
            </FormRowItem>
            <FormRowItem>
              <Button variant="contained" color="primary" onClick={addCountClick}>Add Count</Button>
            </FormRowItem>
            <FormRowItem></FormRowItem>
          </FormRow>
          <FormRow>
            <FormRowItem>
              <FormInputText label="From" name="rangeFrom" type="number" value={formData.rangeFrom} onChange={onTextChange} />
            </FormRowItem>
            <FormRowItem>
              <FormInputText label="To" name="rangeTo" type="number" value={formData.rangeTo} onChange={onTextChange} />
            </FormRowItem>
            <FormRowItem>
              <Button variant="contained" color="primary" type="number" onClick={addEndsClick}>Add Total ends</Button>
            </FormRowItem>
          </FormRow>
        </Grid>
      </Grid>

    </>
  )
}