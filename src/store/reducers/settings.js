export default (state={}, action) => {
  switch(action.type) {
    case 'SET_SETTINGS': {
      return action.payload;
    }
    default:
      return state;
  }
}

const setSettings = (settings)=>({
  type: 'SET_SETTINGS',
  payload: settings,
});

const getSettings = (state)=>state.settings;

export {setSettings, getSettings};