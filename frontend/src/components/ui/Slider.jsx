export default function Slider({ value, onValueChange, min = 8, max = 128 }) {
  return (
    <input
      className="slider"
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(event) => onValueChange(Number(event.target.value))}
    />
  );
}
