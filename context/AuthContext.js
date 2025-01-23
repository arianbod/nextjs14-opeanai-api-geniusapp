"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

const AuthContext = createContext();

export const SESSION_DURATION = 10 * 24 * 60 * 60 * 1000; // 10 days in milliseconds
const TOKEN_SYNC_INTERVAL = 60 * 1000; // Sync every minute

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [tokenBalance, setTokenBalance] = useState(10);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [accountStatus, setAccountStatus] = useState('ACTIVE');
    const router = useRouter();

    // New function to fetch token balance from server
    const syncTokenBalance = useCallback(async () => {
        if (!user?.userId) return;

        try {
            const response = await fetch('/api/tokens/balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.userId }),
            });

            if (response.ok) {
                const { balance } = await response.json();
                setTokenBalance(balance);

                // Update localStorage with new balance
                const storedUser = JSON.parse(localStorage.getItem("user"));
                if (storedUser) {
                    storedUser.tokenBalance = balance;
                    localStorage.setItem("user", JSON.stringify(storedUser));
                }
            }
        } catch (error) {
            console.error('Error syncing token balance:', error);
        }
    }, [user?.userId]);

    // Function to verify token balance before operations
    const verifyTokenBalance = async (requiredTokens) => {
        await syncTokenBalance(); // Ensure we have the latest balance
        return tokenBalance >= requiredTokens;
    };

    const checkAuth = () => {
        try {
            const storedUser = localStorage.getItem("user");
            if (!storedUser) return false;

            const userData = JSON.parse(storedUser);
            const currentTime = new Date().getTime();

            if (currentTime - userData.timestamp >= SESSION_DURATION) {
                logout();
                return false;
            }

            if (userData.status === 'DELETED' || userData.status === 'INACTIVE') {
                logout();
                return false;
            }

            return true;
        } catch (error) {
            console.error("Auth check error:", error);
            return false;
        }
    };

    const setCookieAndStorage = async (userData) => {
        try {
            const timestamp = new Date().getTime();
            const userDataToStore = {
                userId: userData.userId,
                token: userData.token,
                timestamp,
                animalSelection: userData.animalSelection,
                email: userData.email,
                isEmailVerified: userData.isEmailVerified,
                status: userData.status || 'ACTIVE'
            };

            // Set user data in localStorage and cookies first
            localStorage.setItem("user", JSON.stringify(userDataToStore));
            const expires = new Date(timestamp + SESSION_DURATION).toUTCString();
            document.cookie = `user=${encodeURIComponent(JSON.stringify(userDataToStore))}; path=/; expires=${expires}; SameSite=Lax`;

            // Update state
            setUser(userDataToStore);
            setIsEmailVerified(userData.isEmailVerified || false);
            setAccountStatus(userData.status || 'ACTIVE');

            // Sync token balance
            await syncTokenBalance();

            // Get current language
            const lang = window.location.pathname.split('/')[1] || 'en';

            // Return success without checking chat list
            return { success: true, isNewUser: false, lang };

        } catch (error) {
            console.error("Error setting auth data:", error);
            return { success: false, error: "Failed to store authentication data" };
        }
    };

    const register = async (email, animalSelection) => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, animalSelection }),
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.error,
                    details: data.details,
                    validationErrors: data.validationErrors,
                    code: data.code
                };
            }

            if (data.success) {
                const result = await setCookieAndStorage({
                    userId: data.userId,
                    token: data.token,
                    animalSelection,
                    email,
                    isEmailVerified: false,
                    status: 'ACTIVE'
                });

                if (!result.success) {
                    return {
                        success: false,
                        error: "Failed to store authentication data"
                    };
                }

                if (email) {
                    try {
                        await fetch('/api/auth/manage-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: data.userId,
                                action: 'resend'
                            }),
                        });
                    } catch (error) {
                        console.error('Error sending verification email:', error);
                    }
                }

                if (email && data.emailVerification?.required) {
                    toast.success('Please check your email to verify your account');
                }

                return {
                    ...data,
                    isNewUser: result.isNewUser,
                    lang: result.lang,
                    requiresEmailVerification: Boolean(email)
                };
            }

            return data;
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                error: 'An unexpected error occurred',
                code: 'UNKNOWN_ERROR'
            };
        }
    };

    const verifyEmail = async (token) => {
        if (!user?.userId) {
            return { success: false, error: "User not authenticated" };
        }

        try {
            const response = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.userId, token }),
            });

            const data = await response.json();

            if (data.success) {
                setIsEmailVerified(true);
                setUser(prev => ({ ...prev, isEmailVerified: true }));

                const storedUser = JSON.parse(localStorage.getItem("user"));
                storedUser.isEmailVerified = true;
                localStorage.setItem("user", JSON.stringify(storedUser));

                toast.success('Email verified successfully');
                return { success: true };
            }

            toast.error(data.error || 'Email verification failed');
            return { success: false, error: data.error };
        } catch (error) {
            console.error('Email verification error:', error);
            toast.error('Failed to verify email');
            return { success: false, error: 'Verification failed' };
        }
    };

    const updateEmail = async (newEmail) => {
        if (!user?.userId) {
            return { success: false, error: "User not authenticated" };
        }

        try {
            const response = await fetch('/api/auth/manage-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.userId,
                    action: 'update',
                    email: newEmail,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setUser(prev => ({ ...prev, email: newEmail, isEmailVerified: false }));
                setIsEmailVerified(false);

                const storedUser = JSON.parse(localStorage.getItem("user"));
                storedUser.email = newEmail;
                storedUser.isEmailVerified = false;
                localStorage.setItem("user", JSON.stringify(storedUser));

                return { success: true, message: data.message };
            }

            return { success: false, error: data.error };
        } catch (error) {
            console.error('Email update error:', error);
            return { success: false, error: 'Failed to update email' };
        }
    };

    const resendVerificationEmail = async () => {
        if (!user?.userId) {
            return { success: false, error: "User not authenticated" };
        }

        try {
            const response = await fetch('/api/auth/manage-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.userId,
                    action: 'resend',
                }),
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, message: data.message };
            }

            return { success: false, error: data.error };
        } catch (error) {
            console.error('Resend verification error:', error);
            return { success: false, error: 'Failed to resend verification email' };
        }
    };

    const login = async (token, animalSelection) => {
        if (!token?.trim()) {
            return {
                success: false,
                error: "Please enter your authentication token"
            };
        }

        if (!Array.isArray(animalSelection) || animalSelection.length !== 3) {
            return {
                success: false,
                error: "Please select exactly 3 animals in order"
            };
        }

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, animalSelection }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const result = await setCookieAndStorage({
                    userId: data.userId,
                    token: data.token,
                    animalSelection,
                    email: data.email,
                    isEmailVerified: data.isEmailVerified,
                    status: data.status || 'ACTIVE'
                });

                if (!result.success) {
                    return {
                        success: false,
                        error: "Failed to store authentication data"
                    };
                }

                if (data.emailVerification?.required) {
                    toast.info('Please verify your email address');
                }

                return {
                    success: true,
                    token: data.token,
                    message: data.message,
                    isNewUser: result.isNewUser,
                    lang: result.lang,
                    requiresEmailVerification: data.emailVerification?.required
                };
            } else {
                let errorMessage = data.error;
                if (data.remainingAttempts) {
                    errorMessage = `${data.error} (${data.remainingAttempts} attempts remaining)`;
                }
                if (data.remainingLockoutTime) {
                    errorMessage = `${data.error} Try again in ${data.remainingLockoutTime} minutes.`;
                }

                if (data.accountStatus) {
                    errorMessage = `Account ${data.accountStatus.status.toLowerCase()}: ${data.accountStatus.reason}`;
                }

                return {
                    success: false,
                    error: errorMessage,
                    isLocked: data.isLocked,
                    remainingAttempts: data.remainingAttempts,
                    remainingLockoutTime: data.remainingLockoutTime,
                    accountStatus: data.accountStatus
                };
            }
        } catch (error) {
            console.error("Login error:", error);
            return {
                success: false,
                error: "An unexpected error occurred during login. Please try again."
            };
        }
    };

    const logout = async () => {
        try {
            setUser(null);
            setTokenBalance(0);
            setIsEmailVerified(false);
            setAccountStatus('INACTIVE');

            localStorage.clear();
            sessionStorage.clear();

            document.cookie.split(";").forEach(cookie => {
                document.cookie = cookie
                    .replace(/^ +/, "")
                    .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
            });
            document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";

            const lang = window.location.pathname.split('/')[1] || 'en';
            toast.success('Successfully logged out');
            router.refresh();
            router.push(`/${lang}`);
            window.location.reload();

        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Error during logout');
            router.refresh();
            router.replace(`/`);
        }
    };

    // Set up periodic token balance sync
    useEffect(() => {
        if (user?.userId) {
            // Initial sync
            syncTokenBalance();

            // Set up interval for periodic sync
            const intervalId = setInterval(syncTokenBalance, TOKEN_SYNC_INTERVAL);

            return () => clearInterval(intervalId);
        }
    }, [user?.userId, syncTokenBalance]);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                if (!checkAuth()) {
                    logout();
                    return;
                }

                setUser(parsedUser);
                setIsEmailVerified(parsedUser.isEmailVerified || false);
                setAccountStatus(parsedUser.status || 'ACTIVE');

                // Initial token balance sync
                syncTokenBalance();

                const checkVerificationStatus = async () => {
                    try {
                        const response = await fetch('/api/auth/check-verification', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: parsedUser.userId })
                        });

                        if (response.ok) {
                            const { isEmailVerified } = await response.json();

                            if (isEmailVerified !== parsedUser.isEmailVerified) {
                                setIsEmailVerified(isEmailVerified);
                                setUser(prev => ({ ...prev, isEmailVerified }));

                                const storedUserData = JSON.parse(localStorage.getItem("user"));
                                storedUserData.isEmailVerified = isEmailVerified;
                                localStorage.setItem("user", JSON.stringify(storedUserData));
                            }
                        }
                    } catch (error) {
                        console.error('Failed to check verification status:', error);
                    }
                };

                checkVerificationStatus();
            } catch (error) {
                console.error("Error parsing stored user:", error);
                logout();
            }
        }
    }, []);

    const value = {
        user,
        tokenBalance,
        isEmailVerified,
        accountStatus,
        setTokenBalance,
        login,
        register,
        logout,
        verifyEmail,
        updateEmail,
        resendVerificationEmail,
        setUser,
        checkAuth,
        verifyTokenBalance,
        syncTokenBalance,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};