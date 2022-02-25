import { useTheme } from '@material-ui/core';
import { Page, Text, View, Document, StyleSheet, PDFViewer, Font } from '@react-pdf/renderer';
import _ from 'lodash';
import axios from 'axios';
import { useEffect, useState } from 'react';
import Moment from 'moment';
import m1reg from '../fonts/mplus-1m-regular-webfont.ttf';
import m1bold from '../fonts/mplus-1m-bold-webfont.ttf';


const useReportTableStyles = (theme)=>StyleSheet.create({
  table: {
    flexDirection: 'column',
    border: '1px solid #999999',
    boxSizing: 'border-box',
    width: 'auto'
  },
  header: {
    fontWeight: 'bold',
    boxSizing: 'border-box',
    textAlign: 'center',
  },
  row: {
    // flexDirection: 'row'
    flexDirection: 'row',
    borderBottomColor: '#bff0fd',
    boxSizing: 'border-box',
  },
  cell: {
    padding: '0.5mm',
    borderRight: '1px solid #999999',
    wordBreak: 'break-all',
    verticalAlign: 'top',
    borderBottom: '1px dotted #999999',
    boxSizing: 'border-box',
  },
  noBorderBottom: {
    borderBottom: 0,
  },
  noBorderRight: {
    borderRight: 0,
  },
});

export function RegisterFonts() {
  Font.register({ family: 'm1', src: m1reg, fontStyle: 'normal', fontWeight: 'normal'});
  Font.register({ family: 'm1', src: m1bold, fontStyle: 'normal', fontWeight: 'bold'});
}

export function ReportTable({columns=[], rows=[], style}) {
  const theme = useTheme();
  const styles = useReportTableStyles(theme);
  const headerCols = _.flatMap(columns, (column)=>{
    if(column.columns) {
      return column.columns;
    } else {
      return column;
    }
  });
  return (
    <View style={style}>
      <View style={[styles.table]}>
        <ReportTableRow>
          {headerCols.map((col, ci)=>{
            return <ReportTableCell column={col} header last={ci===headerCols.length-1} />
          })}
        </ReportTableRow>
        {(rows||[]).map((row, ri)=>{
          return (
            <ReportTableRow wrap={false}>
            {columns.map((col, ci)=>{
              return <ReportTableCell column={col} row={row} last={ci===columns.length-1} lastRow={ri==rows.length-1} />
            })}
            </ReportTableRow>
          );
        })}
      </View>
    </View>
  );
}

function ReportTableRow({children, wrap=true}) {
  const theme = useTheme();
  const styles = useReportTableStyles(theme);
  return <View style={styles.row} wrap={wrap}>
    {children}
  </View>
}

function ReportTableCell({column=null, row=null, header=false, last=false, lastRow=false}) {
  /* Spanned */
  if(column.columns) {
    if(header) {
      return <ReportTableRow>
        {column.columns.map((sCol, ci)=><Cell column={sCol} value={sCol.name} header={header}
          last={last && ci==column.columns.length-1}/>)}
      </ReportTableRow>
    } else {
      let pivotCols = column.pivot;
      let pivotValue = row[column.columns[0].key];
      let otherCols = column.columns.slice(1);
      let dummyLen = column.columns[0].pivotDataLength - pivotValue.length;
      return <View>
        {pivotCols.map((col, pi)=>{
          let cells = [];
          cells.push([col, col.name]);
          pivotValue?.map((row, ri)=>{
            cells.push([col, row[col.key]]);
          });
          (new Array(dummyLen).fill(0)).map(()=>{
            cells.push([col, '']);
          })
          otherCols.map((ocol)=>{
            cells.push([ocol, row?.[ocol.key]?.[col.key]]);
          });
          return <ReportTableRow>
            {cells.map((cell, ci)=>{
              return <Cell header={ci==0} column={cell[0]} value={cell[1]}
                last={last && ci==cells.length-1} lastRow={lastRow && pi==pivotCols.length-1}/>
            })}
          </ReportTableRow>
        })}
      </View>
    }
  }

  let value = column.name;
  if(!header) {
    value = row[column.key];
  }
  return <Cell header={header} last={last} lastRow={lastRow} column={column} value={value}/>
}

function Cell({header=false, last=false, lastRow=false, column, value=''}) {
  const theme = useTheme();
  const styles = useReportTableStyles(theme);
  const finalStyle = [styles.cell];
  last && finalStyle.push(styles.noBorderRight);
  lastRow && finalStyle.push(styles.noBorderBottom);
  header && finalStyle.push(styles.header);
  column.width && finalStyle.push({width: column.width});
  column.align && !header && finalStyle.push({textAlign: column.align});
  return <View style={finalStyle}>
    <Text style={{marginTop: 'auto', marginBottom: 'auto'}}>
      {value ?? ''}
    </Text>
  </View>;
}

export function ReportField({name, value, margin, style, vertical=false}) {
  let styles = [];
  if(vertical) {
    // styles = [{alignItems: 'center'}];
    style && styles.push(style);
    return (
      <View style={styles}>
        <Text style={{fontWeight: 'bold'}}>{name}</Text><Text>{value}</Text>
      </View>
    );
  }
  styles = [{flexDirection: 'row'}];
  style && styles.push(style);
  margin && styles.push({marginRight: '0.5rem'});
  return (
    <View style={styles}>
      <Text style={{fontWeight: 'bold'}}>{name}: </Text><Text>{value}</Text>
    </View>
  );
}

export function DashedDivider() {
  return (
    <View style={{borderBottom: '1px dashed #999999', margin: '2mm'}}></View>
  );
}

export function NoData() {
  return (
    <Text style={{textAlign: 'center'}}>--- No data ---</Text>
  );
}

export function ReportSection({text}) {
  return <Text style={{fontWeight: 'bold', textAlign: 'center', textDecoration: 'underline', margin: '2mm'}}>{text}</Text>
}

function ReportHeader({reportName, getReportDetails, compHeader}) {
  let reportDetails = getReportDetails && getReportDetails();

  return (
    <>
    <Text style={{fontWeight:"bold", textAlign:"center"}}>
      {reportName}
    </Text>
    <View style={{border: '1px solid #999999', borderRight: 0, borderLeft: 0, paddingTop: 1, paddingBottom: 1, marginBottom: 5, flexDirection: 'row'}}>
      <View style={{flexBasis: '50%'}}>
        <Text style={{fontWeight: 'bold'}}>{compHeader.name}</Text>
        <Text>{compHeader.address}</Text>
        <Text style={{fontWeight: 'bold'}} variant="subtitle2">GSTIN: {compHeader.gst}</Text>
        <Text>{compHeader.contact}, {compHeader.email}</Text>
      </View>
      <View style={{flexBasis: '50%'}}>
        <ReportField name="Generated On" value={Moment(new Date()).format('DD/MM/YYYY')} />
        {reportDetails}
      </View>
    </View>
    </>
  );
}

export function ReportViewer({reportName, getReportDetails, withHeader=true, orientation="potrait", showPageNo=true, children}) {
  const [compHeaders, setCompHeaders] = useState([]);

  useEffect(()=>{
    axios.get(`/api/companies`).then((res) => {
      setCompHeaders(res.data.map((c)=>({label: c.name, value: c.id, data: c})));
    });
  }, []);

  const compHeader = _.find(compHeaders, (c) => c.value === 1)?.data || {};

  return(
    <PDFViewer style={{height: '99%', width: '99%'}}>
      <Document title={reportName}>
        <Page size="A4" orientation={orientation} style={{fontSize: '10px', fontFamily: 'm1', padding: '5mm', paddingBottom: '10mm'}}>
          {children}
          {showPageNo &&
            <Text style={{
              position: 'absolute',
              bottom: '5mm',
              left: 0,
              right: 0,
              textAlign: 'center',
              color: 'grey',
            }} render={({ pageNumber, totalPages }) => (
              `${pageNumber} / ${totalPages}`
            )} fixed />
          }
        </Page>
      </Document>
    </PDFViewer>
  );
}