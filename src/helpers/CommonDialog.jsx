import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import CloseIcon from '@material-ui/icons/Close';
import { Box, IconButton } from '@material-ui/core';

export default function CommonDialog({open, onClose, title, isSaving, onSave, children, showFooter=true, noPadding=false, ...props}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      fullWidth
      disableEscapeKeyDown
      {...props}
    >
      <DialogTitle id="alert-dialog-title">
        <Box display="flex">
          {title}<Box marginLeft="auto"><IconButton size='small' onClick={onClose}><CloseIcon /></IconButton></Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers style={noPadding ? {} : {padding: '0.5rem'}}>
        {children}
      </DialogContent>
      {showFooter &&
      <DialogActions>
        <Button onClick={onClose} color="secondary" variant="outlined">
          Cancel
        </Button>
        {onSave &&
        <Button onClick={onSave} color="primary" variant="contained" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </Button>}
      </DialogActions>}
    </Dialog>
  );
}