import { Button, Link } from "@material-ui/core";
import _ from "lodash";
import { useEffect } from "react";
import { useState, useMemo } from "react";
import { connect } from "react-redux";
import { BASE_URL } from "../api";
import DataGrid from "../components/DataGrid";
import { FormInputSelectSearch, FormInputText, FormRow, FormRowItem } from "../components/FormElements";
import { NOTIFICATION_TYPE, setNotification } from "../store/reducers/notification";
import { getAxiosErr } from "../utils";

function AddToSet({apiObj, qid, sizingOpts, data, qualityName, ...props}) {
  const [setNo, setSetNo] = useState();
  const [sizingId, setSizingId] = useState();
  useEffect(()=>{
  }, [qid]);

  const onAddClick = async ()=>{
    try {
      await apiObj.post(BASE_URL.SIZINGS_SET, {
        setNo: setNo,
        sizingId: sizingId,
        name: qualityName,
        data: data,
        qid: qid
      })
    } catch (err) {
      console.log(err);
      props.setNotification(NOTIFICATION_TYPE.ERROR, getAxiosErr(err));
    }
  }

  return (
    <FormRow>
      <FormRowItem>
        <FormInputText type="number" label="Set No" value={setNo} onChange={(e)=>setSetNo(e.target.value)} />
      </FormRowItem>
      <FormRowItem>
        <FormInputSelectSearch label="Sizing" options={sizingOpts} isClearable={true}
          value={_.find(sizingOpts, (e)=>e.value == sizingId)}
          onChange={(value)=>{
            setSizingId(value?.value);
          }}
        />
      </FormRowItem>
      <FormRowItem>
        <Button color="primary" variant="outlined" onClick={onAddClick} disabled={
          !setNo || !sizingId || !qid || !qualityName
        }>Add</Button>
      </FormRowItem>
      <FormRowItem></FormRowItem>
      <FormRowItem></FormRowItem>
      <FormRowItem></FormRowItem>
    </FormRow>
  )
}

export default connect(()=>{}, (dispatch)=>({
  setNotification: (...args)=>{dispatch(setNotification.apply(this, args))},
  clearNotification: ()=>{dispatch(setNotification(null, null))},
}))(AddToSet);