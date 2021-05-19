import React, { useMemo, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Box, OutlinedInput, CircularProgress, Divider, FormControl, FormHelperText, FormLabel, Grid, InputAdornment, MenuItem, Popover, Select, TextField, Typography, IconButton, RadioGroup, FormControlLabel, Radio } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { ColorPalette, ColorButton } from 'material-ui-color';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import FileCopyOutlinedIcon from '@material-ui/icons/FileCopyOutlined';
import clsx from 'clsx';

const useStyles = makeStyles((theme) => ({
  formRoot: {
    padding: '1rem'
  },
  formRow: {
    // paddingTop: '1rem',
  },
  formInput: {
    marginTop: '0.25rem'
  },
  formInputHighlight: {
    fontWeight: 'bold',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.grey[600],
    }
  },
  inputProfit: {
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.success.main,
      borderWidth: '2px',
  }},
  inputLoss: {
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.error.main,
      borderWidth: '2px',
  }},
  autoComplete: {
    padding: theme.spacing(0.25),
  },
  img: {
    maxWidth: '100%',
    height: 'auto'
  },
  info: {
    color: theme.palette.info.main,
    marginLeft: '0.25rem',
    fontSize: '1rem',
  },
  formDate: {

  }
}));


export function Form({children}) {
  return (
    <form noValidate autoComplete="off">
      {children}
    </form>
  );
}

export function FormRow({print, children}) {
  const classes = useStyles();
  let sizingProps = {xs: 12};
  let items = React.Children.count(children);
  let factor =  {
    1: 12,
    2: 6,
    4: 3,
    3: 4,
    5: 2,
    6: 2,
  }
  sizingProps['md'] = sizingProps['sm'] = sizingProps['lg'] = factor[items] || true;

  if(print) {
    sizingProps['xs'] = factor;
  }

  return(
    <Grid container spacing={1} className={classes.formRow}>
      {React.Children.map(children, (child) => {
        return React.cloneElement(child, sizingProps);
      })}
    </Grid>
  );
}

export function FormRowItem({children, ...props}) {
  return (
    <Grid item {...props} style={{display: 'flex', alignItems: 'flex-end'}}>
      {children}
    </Grid>
  );
}

export function FormInfo({children}) {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState(null);
  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };
  return (
    <>
    <HelpOutlineIcon className={classes.info} onMouseEnter={handlePopoverOpen} onMouseLeave={handlePopoverClose}/>
    <Popover
      style={{pointerEvents: 'none'}}
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'center',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'center',
        horizontal: 'left',
      }}
      onClose={handlePopoverClose}
      disableRestoreFocus
    >
      {children}
    </Popover>
    </>
  )
}

export function FormInput({children, info, ...props}) {
  return (
    <Box width="100%">
      <Box display="flex" style={{alignItems: 'flex-end', marginBottom: '4px'}}>
        <FormLabel component={Box} required={props.required}>
          {props.label}
        </FormLabel>
        {info && <FormInfo>{info}</FormInfo>}
      </Box>
      {children}
      {props.bottomLabel && <Box display="flex" style={{alignItems: 'flex-end'}}>
        <FormLabel component={Box} required={props.required}>
          {props.bottomLabel}
        </FormLabel>
      </Box>}
    </Box>
  );
}

export class FormFieldValidator {
  constructor(formValidators, setFieldError) {
    this.formValidators = formValidators || {};
    this.setFieldError = setFieldError || (()=>{});
  }

  getDefaultValidator(name) {
    const VALIDATORS = {
      'required': (value)=>{
        return (value != null && value != '' && typeof(value) != 'undefined');
      },
      'email': (value)=>{
        return /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/.test(value);
      },
      'password': (value)=>{
        return /((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%]).{8,40})/.test(value);
      },
      'regex': (value, exp)=>{
        const checker = new RegExp(exp);
        return checker.test(value);
      }
    }

    return VALIDATORS[name] || (()=>true);
  }

  doValidation(value, validators, errorMessages) {
    let errMsg = '';
    let validatorParam = null;
    validators = validators || [];
    errorMessages = errorMessages || [];

    for(let i=0; i<validators.length; i++) {
      let validator = validators[i];
      if(typeof(validator) === 'string') {
        validator = this.getDefaultValidator(validator);
      } else if(typeof(validator) === 'object') {
        validatorParam = validator.param;
        validator = this.getDefaultValidator(validator.type);
      }

      if(!validator(value, validatorParam)) {
        errMsg = errorMessages[i] || 'Invalid';
        break;
      }
    }
    return errMsg;
  }

  validateField(name, formData) {
    let errMsg = '';
    let fieldValidators = this.formValidators[name];
    if(fieldValidators) {
      errMsg = this.doValidation(formData[name], fieldValidators.validators, fieldValidators.messages);
      this.setFieldError(name, errMsg);
    }
    return errMsg;
  }

  validateAll(formData) {
    let isAllValid = true;
    Object.keys(this.formValidators).forEach(name => {
      let errMsg = this.validateField(name, formData);
      if(Boolean(errMsg)) {
        isAllValid = false;
      }
    });
    return isAllValid;
  }
}

export function FormInputText({InputIcon, errorMsg, required, onChange, label, bottomLabel, readOnly, info, hasCopy, inputProps, highlight, profit, ...props}) {
  const classes = useStyles();

  return (
    <FormInput required={required} label={label} bottomLabel={bottomLabel} info={info}>
      <FormControl error={Boolean(errorMsg)} fullWidth>
        <OutlinedInput
          variant="outlined"
          startAdornment={InputIcon &&
            <InputAdornment position="start">{typeof(InputIcon) === 'string'
              ? <span>{InputIcon}</span> : <InputIcon fontSize='small' />}</InputAdornment>}
          endAdornment={hasCopy ?
            <IconButton><FileCopyOutlinedIcon /></IconButton> : null
          }
          fullWidth
          className={clsx(
            classes.formInput,
            highlight && classes.formInputHighlight,
            profit && props.value && (props.value > 0 ? classes.inputProfit : classes.inputLoss)
          )}
          error={Boolean(errorMsg)}
          data-label={label}
          data-required={required}
          inputProps={{
            'data-label': label,
            'data-required': required,
            readOnly: Boolean(readOnly),
            ...inputProps,
          }}
          onChange={onChange}
          onBlur={onChange}
          {...props}
        />
        <FormHelperText>{errorMsg}</FormHelperText>
      </FormControl>
    </FormInput>
  );
}

export function FormInputRadio({label, options}) {
  return (
    <FormInput label={label}>
      <FormControl component="fieldset">
        <RadioGroup row aria-label="position" name="position" defaultValue="meter">
          {(options||[]).map((o)=>{
            return <FormControlLabel value={o.value} control={<Radio color="primary" />} label={o.label} />;
          })}
        </RadioGroup>
      </FormControl>
    </FormInput>
  );
}

export function FormInputSelect({
    errorMsg, required, onChange, label, options, firstEmpty=false, loading, multiple, hasSearch=false,
    labelKey='label', valueKey='value', ...props}) {
  const classes = useStyles();
  options = options || [];

  const noOptions = (options.length == 0);

  if(hasSearch) {
    return (
      <FormInput required={required} label={label}>
        <FormControl error={Boolean(errorMsg)} fullWidth>
          <Autocomplete
            multiple={multiple}
            options={options}
            loading={loading}
            filterSelectedOptions
            onChange={onChange}
            className={clsx(classes.formInput)}
            getOptionLabel={(option) => typeof(option) === 'string' ? option : option[labelKey]}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label=""
                placeholder={props.placeholder}
                error={Boolean(errorMsg)}
                inputProps={{
                  ...params.inputProps,
                  className: classes.autoComplete,
                }}
              />
            )}
            ChipProps={{
              variant:"outlined",
            }}
            {...props}
          />
          <FormHelperText>{errorMsg}</FormHelperText>
        </FormControl>
      </FormInput>
    );
  } else {
    return (
      <FormInput required={required} label={label}>
        <FormControl error={Boolean(errorMsg)} fullWidth>
          <Select
            onChange={onChange}
            onBlur={onChange}
            variant="outlined"
            className={classes.formInput}
            fullWidth
            helperText={errorMsg}
            {...props}
          >
            {noOptions && <MenuItem value=''><em>{loading ? 'Loading...' : 'None'}</em></MenuItem>}
            {!noOptions && firstEmpty && <MenuItem value=""><em>None</em></MenuItem>}
            {options.map((opt)=>{
              let label = '', value = '';

              if(typeof(opt) === 'string') {
                label = value = opt;
              } else {
                label = opt[labelKey];
                value = opt[valueKey];
              }
              return  <MenuItem key={value} value={value}>{label}</MenuItem>
            })}
          </Select>
          <FormHelperText>{errorMsg}</FormHelperText>
        </FormControl>
      </FormInput>
    );
  }
}

export function FormHeader({title, hasTopDivider, loadingText}) {
  return (
    <>
      {hasTopDivider && <Divider style={{marginTop: '1rem', marginBottom: '1rem'}} variant="middle" />}
      <Box display="flex">
      <Typography variant="h6" color="primary">{title}</Typography>
      {loadingText &&
      <>
      <CircularProgress size={24} style={{marginLeft: 15, position: 'relative', top: 4}} />
      <Typography style={{alignSelf:'center'}}>&nbsp;{loadingText}</Typography>
      </>}
      </Box>
    </>
  );
}

export function PasswordPolicy() {
  return (
    <Box style={{padding: '0.5rem'}}>
      <Typography>
      * Must contain one digit from 0-9<br/>
      * Must contain one lowercase characters<br/>
      * Must contain one uppercase characters<br/>
      * Must contain one special symbols in the list "@#$%"<br/>
      * Length at least 8 characters and maximum of 40<br/>
      </Typography>
    </Box>
  )
}