export function PrimaryButton({ children, className = '', ...props }) {
  return <button className={`btn-primary ${className}`.trim()} {...props}>{children}</button>
}

export function SecondaryButton({ children, className = '', ...props }) {
  return <button className={`btn-secondary ${className}`.trim()} {...props}>{children}</button>
}
