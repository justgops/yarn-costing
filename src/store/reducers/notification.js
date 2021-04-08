const NOTIFICATION_TYPE = {
  ERROR: 'error',
  SUCCESS: 'success',
  INFO: 'info',
}

export default (state={}, action) => {
  switch(action.type) {
    case 'SET_NOTIFICATION': {
      return {
        ...state,
        message: action.payload.message,
        type: action.payload.type,
      };
    }
    default:
      return state;
  }
}

const setNotification = (type, message)=>({
  type: 'SET_NOTIFICATION',
  payload: {
    type: type ? type : 'info',
    message: message ? message : '',
  }
});

export {NOTIFICATION_TYPE, setNotification};