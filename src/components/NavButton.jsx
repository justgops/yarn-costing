import { Button, ButtonBase, useTheme } from '@material-ui/core';
import React from 'react';
import { useRouteMatch, Link as RouteLink, withRouter } from 'react-router-dom';

const NavButton = ({path, ...props}) => {
  let theme = useTheme();
  let {children, ...otherProps} = props;
  let match = useRouteMatch({
    path: path,
  });
  return <Button style={{fontSize: theme.typography.fontSize*1.1}} component={RouteLink} to={path} {...otherProps} color={match ? "primary" : "default"} disableTouchRipple>{children}</Button>;
}

export default withRouter(NavButton);