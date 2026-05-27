type GhanaPhoneFieldProps = {
  id: string
  label: string
  name: string
  placeholder?: string
  defaultValue?: string
  required?: boolean
}

export default function GhanaPhoneField({
  id,
  label,
  name,
  placeholder = '24xxxxxxx',
  defaultValue,
  required = false,
}: GhanaPhoneFieldProps) {
  return (
    <section className="channel_container">
      <div className="kpy-col-input-field">
        <label htmlFor={id} className="kpy-col-label">
          {label}
        </label>
        <div className="phone-input-field">
          <div className="input-group-prepend" style={{ display: 'flex' }}>
            <div className="telco-detector mobile-money-telco-detector">
              <div className="telco-display">
                <span className="telco-name">233</span>
                <span className="dropdown-arrow">▼</span>
              </div>
            </div>
          </div>
          <input
            aria-label={id}
            className="kpy-col-input --mobile-money-details"
            data-testid={id}
            id={id}
            inputMode="numeric"
            maxLength={9}
            name={name}
            pattern="[0-9]{9}"
            placeholder={placeholder}
            required={required}
            type="text"
            defaultValue={defaultValue}
          />
        </div>
      </div>
    </section>
  )
}
