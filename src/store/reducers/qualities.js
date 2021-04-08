export default (state={}, action) => {
  switch(action.type) {
    case 'SET_QUALITIES': {
      return [
        ...action.payload,
      ];
    }
    default:
      return state;
  }
}

const setQualities = (qualities)=>({
  type: 'SET_QUALITIES',
  payload: qualities,
});

const getQualities = (state)=>state.qualities;

export {setQualities, getQualities};