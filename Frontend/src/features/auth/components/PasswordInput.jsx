import { useState } from "react"

/**
 * @description Shared password field with a show/hide toggle.
 * Used by both Login and Register so the behavior/markup lives in one place.
 */
const PasswordInput = ({ id, name, value, onChange, placeholder, required }) => {
    const [showPassword, setShowPassword] = useState(false)

    return (
        <div className="password-input">
            <input
                onChange={onChange}
                value={value}
                type={showPassword ? "text" : "password"}
                id={id}
                name={name}
                placeholder={placeholder}
                required={required}
                className="password-input__field"
            />
            <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="password-input__toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
            >
                {showPassword ? "Hide" : "Show"}
            </button>
        </div>
    )
}

export default PasswordInput
