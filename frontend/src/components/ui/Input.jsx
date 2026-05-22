export default function Input(props) {
  return <input className={`input ${props.className || ''}`.trim()} {...props} />;
}
