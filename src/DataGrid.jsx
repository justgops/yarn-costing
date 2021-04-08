import { makeStyles } from '@material-ui/core'
import React, { useEffect } from 'react'
import { useGlobalFilter, useTable } from 'react-table';
import clsx from 'clsx';

const useStyles = makeStyles((theme)=>({
  grid: {
    borderSpacing: 0,
    width: '100%',
    overflow: 'auto',
    border: theme.mixins.border,
  },
  tableCell: {
    margin: 0,
    textAlign: 'left',
    fontWeight: 'initial',
    padding: theme.spacing(1),
    borderRight: theme.mixins.border,
    borderBottom: theme.mixins.border,
  },
}));

export default function DataGrid({ columns, data, filterText, tdClassName }) {
  const classes = useStyles();
  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    setGlobalFilter
  } = useTable({
    columns,
    data: data,
  }, useGlobalFilter);

  useEffect(()=>{
    setGlobalFilter(filterText);
  }, [filterText])

  // Render the UI for your table
  return (
    <table {...getTableProps()} className={classes.grid}>
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th {...column.getHeaderProps()} className={classes.tableCell}>{column.render('Header')}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row, i) => {
          prepareRow(row)
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map(cell => {
                return <td {...cell.getCellProps()} className={clsx(classes.tableCell, tdClassName)}>{cell.render('Cell')}</td>
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}