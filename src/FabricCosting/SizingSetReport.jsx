import { Text, View } from "@react-pdf/renderer";
import { ReportField, ReportTable } from "../components/PDFRenderComponents";

function CommonHeader({biding=true}) {
  return (
    <>
    <View style={{borderBottom: '1px solid #999999', padding: '4px 0px'}}>
      <Text>The address will come here 416115</Text>
    </View>
    <View style={{flexDirection: 'row', padding: '4px 0px'}}>
      <View style={{flexBasis: '50%'}}><ReportField name="Date" value="" /></View>
      <View style={{flexBasis: '50%'}}><ReportField name="Set No" value={"1"} /></View>
    </View>
    <View style={{padding: '4px 0px'}}>
      <ReportField name="Party" value="Sample party" />
    </View>
    <View style={{flexDirection: 'row', padding: '4px 0px'}}>
      <Text style={{textDecoration: 'underline', fontWeight: 'bold', margin: 'auto', letterSpacing: '2px'}}>
        {biding ? 'Biding Details' : 'Warping & Sizing details'}
      </Text>
    </View>
    </>
  )
}

function LeftSide() {
  return (
    <>
    <CommonHeader biding={true}/>
    <View style={{flexDirection: 'row', padding: '4px 0px'}}>
      <View style={{flexBasis: '50%'}}><ReportField name="Yarn No." value="" /></View>
      <View style={{flexBasis: '50%'}}><ReportField name="Mill Name" value="" /></View>
    </View>
    <ReportTable columns={[
      {name: 'Sr No', key: 'srNo', width: '10mm'},
      {
        name: 'Cone',
        key: 'cone',
        width: '30mm',
        align: 'right',
        Footer: (info)=>{
          // let total = info.rows.reduce((sum, row) => {
          //     return (parse(row.values[info.column.id]) || 0) + sum
          //   }, 0
          // );
          // total = round(total, true);
          return <span style={{fontWeight: 'bold'}}>{0}</span>
        }
      },
      {
        name: 'Gross Wt.',
        key: 'grossWt',
        width: '50mm',
        align: 'right',
        Footer: (info)=>{
          // let total = info.rows.reduce((sum, row) => {
          //     return (parse(row.values[info.column.id]) || 0) + sum
          //   }, 0
          // );
          // total = round(total, true);
          return <span style={{fontWeight: 'bold'}}>{0}</span>
        }
      },
      {
        name: 'Net Wt.',
        key: 'netWt',
        width: '50mm',
        align: 'right',
        Footer: (info)=>{
          // let total = info.rows.reduce((sum, row) => {
          //     return (parse(row.values[info.column.id]) || 0) + sum
          //   }, 0
          // );
          // total = round(total, true);
          return <span style={{fontWeight: 'bold'}}>{0}</span>
        }
      },
    ]} rows={[
      {cone: '123', grossWt: '123', netWt: 123},
      {cone: '123', grossWt: '123', netWt: 123},
      {cone: '123', grossWt: '123', netWt: 123},
    ]}/>
    </>
  )
}

function RightSide() {
  return (
    <>
    <CommonHeader biding={false}/>
    <View style={{flexDirection: 'row', padding: '4px 0px'}}>
      <View style={{flexBasis: '33.33%'}}><ReportField name="Yarn No." value="" /></View>
      <View style={{flexBasis: '40%'}}><ReportField name="Mill Name" value="" /></View>
      <View style={{flexBasis: '27.17%'}}><ReportField name="Bag Count" value="" /></View>
    </View>
    <View style={{flexDirection: 'row', padding: '4px 0px'}}>
      <View style={{flexBasis: '25%'}}><ReportField name="Tara" value={123212123123} vertical/></View>
      <View style={{flexBasis: '25%'}}><ReportField name="Rule" value={123212123123} vertical/></View>
      <View style={{flexBasis: '25%'}}><ReportField name="Measure" value={123212123123} vertical/></View>
      <View style={{flexBasis: '25%'}}><ReportField name="Quality" value={123212123123} vertical/></View>
    </View>
    <ReportTable columns={[
      {name: 'Sr No', key: 'srNo', width: '10mm'},
      {name: '', key: 'type', width: '30mm'},
      {name: 'Bags', key: 'bags', width: '22mm', align: 'right',},
      {name: 'Cones', key: 'cones', width: '22mm', align: 'right',},
      {
        name: 'Gross Wt.',
        key: 'grossWt',
        width: '40mm',
        align: 'right',
      },
      {
        name: 'Net Wt.',
        key: 'netWt',
        width: '40mm',
        align: 'right',
      }
    ]} rows={[
      {type: 'Gatepass', cones: '123', grossWt: '123', netWt: 123},
      {type: 'From Sizing', cones: 435, grossWt: '123', netWt: 123},
      {cones: '123', grossWt: '123', netWt: 123},
    ]}/>
    </>
  )
}

export default function SizingSetReport() {
  return (
    <View style={{flexDirection: 'row'}}>
      <View style={{flexBasis: '49%'}}>
        <LeftSide />
      </View>
      <View style={{flexBasis: '2%', display: 'flex'}}>
        <View style={{width: '1px', height: '100%', border: '0.5px dashed #dbdada', margin: 'auto'}} />
      </View>
      <View style={{flexBasis: '49%'}}>
        <RightSide />
      </View>
    </View>
  );
}