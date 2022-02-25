import { Grid, IconButton, Link } from "@material-ui/core";
import _ from "lodash";
import { useEffect } from "react";
import { useState, useMemo } from "react";
import { BASE_URL } from "../api";
import DataGrid from "../components/DataGrid";
import DescriptionOutlinedIcon from '@material-ui/icons/DescriptionOutlined';
import CommonDialog from "../helpers/CommonDialog";
import { ReportField, ReportViewer } from "../components/PDFRenderComponents";
import SizingSetReport from "./SizingSetReport";

export default function SizingSets({apiObj, qid, sizingOpts}) {
  const [sizingData, setSizingData] = useState([]);
  const [selectedSet, setSelectedSet] = useState();
  const columns = useMemo(()=>[
    {
      Header: '',
      id: 'btn-report',
      width: '30px',
      Cell: ({value, row})=>{
        return <IconButton onClick={()=>{setSelectedSet(row.original)}} ><DescriptionOutlinedIcon /></IconButton>;
      }
    },
    {
      Header: 'Set No',
      accessor: 'setNo',
      width: '20%',
    },
    {
      Header: 'Sizing Name',
      accessor: 'sizingId',
      width: '40%',
      Cell: ({value})=>{
        return <span>{(_.find(sizingOpts, (e)=>e.value==value)||{}).label}</span>;
      },
    },
    {
      Header: 'Quality Name',
      accessor: 'name',
      width: '40%',
    }
  ], [sizingOpts]);

  useEffect(()=>{
    if(qid) {
      const fetchSets = async ()=>{
        let res = await apiObj.get(BASE_URL.SIZINGS_SET + '/' + qid);
        setSizingData(res.data);
      }
      fetchSets();
    }
  }, [qid]);

  return <>
    <DataGrid columns={columns} data={sizingData} fixedLayout={true} noRowsMessage="No sets" />
    <CommonDialog title={'Tippan'} onClose={()=>{setSelectedSet(null)}} open={Boolean(selectedSet)} showFooter={false} maxWidth="xl" noPadding={true} PaperProps={{style: {height: '100%'}}}>
      <ReportViewer orientation="landscape" showPageNo={false}>
        <SizingSetReport />
      </ReportViewer>
    </CommonDialog>
  </>
}