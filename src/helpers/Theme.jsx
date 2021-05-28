import React from 'react';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

const defaultTheme = createMuiTheme();

const globalTheme = createMuiTheme({
    palette: {
        primary: {
            main: '#0089ef',
        },
        secondary: {
            main: '#e53935',
        },
        info: {
            main: '#f18009'
        },

    },
    typography: {
        fontSize: 14,
        body1: {
            fontSize: 14,
        }
    }
});

export const theme = createMuiTheme({
    transitions: {
        // So we have `transition: none;` everywhere
        create: () => 'none',
    },
    mixins: {
        ...globalTheme.mixins,
        border: '1px solid '+globalTheme.palette.grey[300]
    },
    props: {
        MuiTextField: {
            size: 'small',
            variant: 'outlined',
        },
        MuiButton: {
            size: 'medium',
            disableTouchRipple: true,
        },
        MuiIconButton: {
            size: 'small',
            disableTouchRipple: true,
        },
        MuiPaper: {
            variant: "outlined"
        }
    },
    overrides: {
        MuiTabs: {
            root: {
                minHeight: 0,
            },
        },
        MuiTab: {
            root: {
                minHeight: '40px',
                [defaultTheme.breakpoints.up('sm')]: {
                    minWidth: '80px',
                },
                fontWeight: 'bold'
            },
            textColorInherit: {
                textTransform: 'none',
                opacity: 1,
            }
        },
        MuiButton: {
            root: {
                textTransform: 'none'
            }
        },
        MuiFormLabel: {
            root: {
                color: defaultTheme.palette.text.primary,
                fontSize: defaultTheme.typography.fontSize,
            },
            asterisk: {
                color: defaultTheme.palette.error.main,
            }
        },
        MuiToolbar: {
            dense: {
                minHeight: '42px',
            }
        },
        MuiOutlinedInput: {
            input: {
                padding: defaultTheme.spacing(0.75, 1),
                '&[readonly]':{
                    backgroundColor: defaultTheme.palette.grey[200],
                    opacity: 0.75
                },
                borderRadius: 'inherit',
            },
            inputMarginDense: {
                padding: defaultTheme.spacing(1, 1.5),
            },
            adornedEnd: {
                paddingRight: defaultTheme.spacing(0.5),
            }
        },
        MuiAutocomplete: {
            inputRoot: {
                padding: '0px',
            }
        },
        MuiDialogTitle: {
            root: {
                padding: defaultTheme.spacing(1),
            }
        },
        MuiDialogContent: {
            dividers: {
                padding: defaultTheme.spacing(1, 0.5),
            }
        },
        MuiFormControlLabel: {
            root: {
                marginLeft: 0,
            }
        },
        PrivateSwitchBase: {
            root: {
                padding: defaultTheme.spacing(0.5),
            }
        },
        PrivateTabIndicator: {
            root: {
                height: '3px',
            }
        }
    },
}, globalTheme);

export default function Theme(props) {
    return (
        <ThemeProvider theme={theme}>
            {props.children}
        </ThemeProvider>
    )
}