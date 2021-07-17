import { makeStyles } from '@material-ui/core'
import React, { useEffect } from 'react'
import { useFilters, useFlexLayout, useGlobalFilter, useTable } from 'react-table';
import clsx from 'clsx';
import { Children } from 'react';

const useStyles = makeStyles((theme)=>({
  grid: {
    borderSpacing: 0,
    width: '100%',
    overflow: 'auto',
    border: theme.mixins.border,
    borderRadius: theme.spacing(0.5),
  },

  fixedLayout: {
    tableLayout: 'fixed',
  },
  tableCell: {
    margin: 0,
    textAlign: 'left',
    verticalAlign: 'top',
    fontWeight: 'initial',
    padding: theme.spacing(0.5, 1),
    borderRight: theme.mixins.border,
    borderBottom: theme.mixins.border,
  },
  actionCell: {
    padding: theme.spacing(0.5, 0),
    textAlign: 'center',
  },
  tableCellLessPad: {
    padding: theme.spacing(0.5),
  },
  noRows: {
    textAlign: 'center',
  },
  noPadding: {
    padding: '0px',
  },
  noBorder: {
    border: 0,
  },
  noCellBorder: {
    borderRight: 0,
    borderBottom: 0,
  },
  middle: {
    verticalAlign: 'middle',
  }
}));

export default function DataGrid({
    columns, data, filterObj=[], showFooter=false, tdClassName, fixedLayout=false,
    print=false, noRowsMessage="No rows found" }) {
  const classes = useStyles();
  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    footerGroups,
    rows,
    prepareRow,
    setAllFilters
  } = useTable({
    columns,
    data: data,
  }, useFilters);

  useEffect(()=>{
    setAllFilters(filterObj);
  }, [filterObj])

  // Render the UI for your table
  return (
    <table {...getTableProps()} className={clsx(classes.grid, fixedLayout ? classes.fixedLayout : null)}>
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.filter((column)=>print ? Boolean(column.Print) : true).map(column => (
              <th {...column.getHeaderProps()} className={classes.tableCell}
                style={fixedLayout ? {width: column.width} : {}}>{column.render('Header')}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row, i) => {
          prepareRow(row)
          return (
            <tr {...row.getRowProps()}>
              {row.cells.filter((cell)=>print ? Boolean(cell.column.Print) : true).map(cell => {
                let actionBtn = cell.column?.id.startsWith('btn-');
                return <td {...cell.getCellProps()} className={clsx(classes.tableCell, actionBtn?classes.actionCell:null, tdClassName)}>{cell.render(print ? 'Print' : 'Cell')}</td>
              })}
            </tr>
          )
        })}
        {rows.length == 0 &&
          <tr>
            <td className={clsx(classes.tableCell, classes.noRows)} colSpan="100%">{noRowsMessage}</td>
          </tr>
        }
      </tbody>
      {showFooter &&
      <tfoot>
        {footerGroups.map(group => (
          <tr {...group.getFooterGroupProps()}>
            {group.headers.filter((column)=>print ? Boolean(column.Print) : true).map(column => (
              <td {...column.getFooterProps()} className={clsx(classes.tableCell, tdClassName)}>{column.render(print ? 'PrintFooter' : 'Footer')}</td>
            ))}
          </tr>
        ))}
      </tfoot>}
    </table>
  )
}

export function TableLayout({children, className, fixedLayout}) {
  const classes = useStyles();
  return (
    <table className={clsx(classes.grid, classes.noBorder, fixedLayout ? classes.fixedLayout : null, className)}>
      <tbody>
        {children}
      </tbody>
    </table>
  )
}

export function TableLayoutRow({children}) {
  return (
    <tr>{children}</tr>
  );
}

export function TableLayoutCell({children, className, ...props}) {
  const classes = useStyles();
  return (
    <td className={clsx(classes.tableCell, classes.tableCellLessPad, classes.noCellBorder, classes.middle, className)} {...props}>{children}</td>
  )
}