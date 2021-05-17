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
