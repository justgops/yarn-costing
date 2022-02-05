import Decimal from 'decimal.js';

const ROUND_DECIMAL = 5;
export default function MyMath(num) {
  const wrapper = (onum) => ({
    _num: onum,
    add: function(num) {
      let calcVal = this._num.add(num || '0');
      return wrapper(calcVal);
    },
    sub: function(num) {
      let calcVal = this._num.sub(num || '0');
      return wrapper(calcVal);
    },
    mul: function(num) {
      let calcVal = this._num.mul(num || '0');
      return wrapper(calcVal);
    },
    div: function(num) {
      let calcVal = this._num.div(num || '0');
      return wrapper(calcVal);
    },
    floor: function() {
      let calcVal = new Decimal(this._num.toFixed(ROUND_DECIMAL, Decimal.ROUND_DOWN));
      return wrapper(calcVal);
    },
    toString: function(toDecimals=false, decimals=ROUND_DECIMAL) {
      if(this._num.isInteger() && !toDecimals){
        return this._num.toString();
      }
      return this._num.toFixed(decimals);
    },
    greaterThanOrEqualTo: function(num) {
      return this._num.greaterThanOrEqualTo(num);
    }
  });
  return wrapper(new Decimal(num || '0'));
}