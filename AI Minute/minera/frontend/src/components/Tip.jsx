export default function Tip({ text, children }) {
  return <span className="tip-w" data-tip={text} tabIndex={0}>{children}</span>;
}
