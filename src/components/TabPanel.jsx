import { Button, Tab, useTheme } from "@material-ui/core";
import React from "react";

export default function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      style={{flexGrow: 1, minHeight: 0}}
    >
      {value === index && (
        <>{children}</>
      )}
    </div>
  );
}

export function ButtonTab(btnProps) {
  const theme = useTheme();
  return <Tab
    component={(props)=>{
      return <Button color="primary" variant={props['aria-selected'] ? "contained" : "outlined"} {...props}>{btnProps.label}</Button>
    }}
    {...btnProps}
    />;
}
