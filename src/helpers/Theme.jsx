import React from 'react';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

const defaultTheme = createMuiTheme();

const globalTheme = createMuiTheme({
    palette: {
        primary: {
            main: '#0089ef',
        },
        secondary: {
            main: '#c0d6df',
        },
        info: {
            main: '#fde74c'
        },

    },
    typography: {
        fontSize: 14,
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
    transitions: {
        duration: {
          shortest: 50,
          shorter: 100,
          short: 150,
          standard: 200,
          complex: 175,
          enteringScreen: 125,
          leavingScreen: 95,
        }
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
                padding: defaultTheme.spacing(1, 1.5),
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
        }
    }
}, globalTheme);

export default function Theme(props) {
    return (
        <ThemeProvider theme={theme}>
            {props.children}
        </ThemeProvider>
    )
}