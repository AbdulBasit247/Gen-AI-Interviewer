import { createContext, useState } from "react";

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null)
    const [authLoading, setAuthLoading] = useState(true)
    const [loginLoading, setLoginLoading] = useState(false)
    const [registerLoading, setRegisterLoading] = useState(false)
    const [logoutLoading, setLogoutLoading] = useState(false)
    const [error, setError] = useState(null)

    return (
        <AuthContext.Provider value={{ user, setUser, authLoading, setAuthLoading, loginLoading, setLoginLoading, registerLoading, setRegisterLoading, logoutLoading, setLogoutLoading, error, setError }}>
            {children}
        </AuthContext.Provider>
    )
}
