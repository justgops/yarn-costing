import React from 'react';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

const defaultTheme = createMuiTheme();

const globalTheme = createMuiTheme({
    palette: {
        primary: {
            main: '#016FB9',
            main: '#2364AA',
            light: '#cbe3f5',
            dark: '#064879',
        },
        secondary: {
            main: '#B0413E',
            light: '#ffd8d7',
        },
        info: {
            main: '#f18009'
        },
        background: {
            default: '#fff',
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
        border: '1px solid '+globalTheme.palette.grey[300],
        borderDark: '1px solid '+globalTheme.palette.grey[400],
    },
    props: {
        MuiTextField: {
            size: 'small',
            variant: 'outlined',
        },
        MuiButton: {
            size: 'small',
            disableTouchRipple: true,
        },
        MuiToggleButton: {
            disableTouchRipple: true,
        },
        MuiIconButton: {
            size: 'small',
            disableTouchRipple: true,
        },
        MuiPaper: {
            variant: "outlined"
        },
        MuiMenuItem: {
            disableTouchRipple: true,
        }
    },
    overrides: {
        MuiTabs: {
            root: {
                minHeight: 0,
            },
            flexContainer: {
                padding: defaultTheme.spacing(0.5),
            }
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
            },
        },
        MuiButton: {
            root: {
                textTransform: 'none'
            }
        },
        MuiIconButton: {
            sizeSmall: {
                padding: 0,
            }
        },
        MuiToggleButtonGroup: {
            root: {
                margin: globalTheme.spacing(0.5, 0),
            }
        },
        MuiToggleButton: {
            root: {
                textTransform: 'none',
                color: globalTheme.palette.primary.main,
                borderColor: globalTheme.palette.primary.main,
                '&$selected': {
                    backgroundColor: globalTheme.palette.primary.main,
                    color: globalTheme.palette.primary.contrastText,
                    '&:hover': {
                        backgroundColor: globalTheme.palette.primary.dark,
                    }
                },
            },
            sizeSmall: {
                padding: '3px 16px',
            },
        },
        MuiFormLabel: {
            root: {
                color: globalTheme.palette.text.primary,
                fontSize: globalTheme.typography.fontSize,
            },
            asterisk: {
                color: globalTheme.palette.error.main,
            }
        },
        MuiToolbar: {
            dense: {
                minHeight: '34px',
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
    otherVars: {
        reactSelect: {
            padding: '5px 8px',
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