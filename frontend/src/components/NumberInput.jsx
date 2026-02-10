import { convertToNumber } from '../utils/numberToArabicWords';

function NumberInput({ value, onChange, ...props }) {
  function handleChange(e) {
    const converted = convertToNumber(e.target.value);
    onChange({ ...e, target: { ...e.target, value: converted } });
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={handleChange}
      {...props}
    />
  );
}

export default NumberInput;
