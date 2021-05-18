import { makeStyles } from '@material-ui/core'
import React, { useEffect } from 'react'
import { useFlexLayout, useGlobalFilter, useTable } from 'react-table';
import clsx from 'clsx';
import { Children } from 'react';

const useStyles = makeStyles((theme)=>({
  grid: {
    borderSpacing: 0,
    width: '100%',
    overflow: 'auto',
    border: theme.mixins.border,
  },

  fixedLayout: {
    tableLayout: 'fixed',
  },
  tableCell: {
    margin: 0,
    textAlign: 'left',
    verticalAlign: 'top',
    fontWeight: 'initial',
    padding: theme.spacing(1),
    borderRight: theme.mixins.border,
    borderBottom: theme.mixins.border,
  },
  tableCellLessPad: {
    padding: theme.spacing(0.5),
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
  }
}));

export default function DataGrid({ columns, data, filterText, showFooter=false, tdClassName, fixedLayout=false, print=false }) {
  const classes = useStyles();
  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    footerGroups,
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
    <table {...getTableProps()} className={clsx(classes.grid, fixedLayout ? classes.fixedLayout : null)}>
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.filter((column)=>print ? Boolean(column.Print) : true).map(column => (
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
              {row.cells.filter((cell)=>print ? Boolean(cell.column.Print) : true).map(cell => {
                return <td {...cell.getCellProps()} className={clsx(classes.tableCell, tdClassName)}>{cell.render(print ? 'Print' : 'Cell')}</td>
              })}
            </tr>
          )
        })}
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
    <td className={clsx(classes.tableCell, classes.tableCellLessPad, classes.noCellBorder, className)} {...props}>{children}</td>
  )
}