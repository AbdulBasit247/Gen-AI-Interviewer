import { useContext, useEffect } from "react";
import { toast } from "sonner";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe } from "../services/auth.api";

export const useAuth = () => {

    const context = useContext(AuthContext)
    const { user, setUser, authLoading, setAuthLoading, loginLoading, setLoginLoading, registerLoading, setRegisterLoading, logoutLoading, setLogoutLoading, error, setError } = context

    const handleLogin = async ({ email, password }) => {
        setLoginLoading(true)
        setError(null)
        try {
            const data = await login({ email, password })
            setUser(data.user)
            toast.success(data.message || "Logged in successfully!")
            return true
        } catch (err) {
            const message = err.response?.data?.message || "Login failed. Please try again."
            setError(message)
            toast.error(message)
            return false
        } finally {
            setLoginLoading(false)
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        setRegisterLoading(true)
        setError(null)
        try {
            const data = await register({ username, email, password })
            setUser(data.user)
            toast.success(data.message || "Account created successfully!")
            return true
        } catch (err) {
            const message = err.response?.data?.message || "Registration failed. Please try again."
            setError(message)
            toast.error(message)
            return false
        } finally {
            setRegisterLoading(false)
        }
    }

    const handleLogout = async () => {
        setLogoutLoading(true)
        setError(null)
        try {
            const data = await logout()
            setUser(null)
            toast.success(data?.message || "Logged out successfully!")
        } catch (err) {
            const message = err.response?.data?.message || "Logout failed. Please try again."
            toast.error(message)
        } finally {
            setLogoutLoading(false)
        }
    }

    // On app load, try to restore the logged-in user from cookie.
    // Intentionally silent on failure — "not logged in yet" is a normal
    // state on first visit, not an error worth toasting.
    useEffect(() => {

        const getAndSetUser = async () => {
            try {
                const data = await getMe()
                setUser(data.user)
            } catch (err) {
                setUser(null)
            } finally {
                setAuthLoading(false)
            }
        }

        getAndSetUser()

    }, [])

    return { user, authLoading, loginLoading, registerLoading, logoutLoading, error, handleRegister, handleLogin, handleLogout }
}
