import type { AuthResponse, MeResponse } from "@finapse/types";
import { apiBaseUrl } from "./index";

export const login = async (email: string, password: string): Promise<AuthResponse> => {
    const res = await fetch(`${apiBaseUrl}/auth/login`, {
       method: "POST",
       headers: {
        "Content-Type": "application/json",
       },
       credentials: "include",
       body: JSON.stringify({email, password}),
    })

    if(!res.ok){
        const error = await res.json();
        throw error;
    }

    return res.json();
}

export const register = async(email: string, password: string, fullName: string): Promise<AuthResponse> => {
    const res = await fetch(`${apiBaseUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password, fullName }),
      });

      if(!res.ok){
        const error = await res.json();
        throw error;
    }

    return res.json();
}

export const me = async (): Promise<MeResponse> => {
    const res = await fetch(`${apiBaseUrl}/auth/me`, {
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Not authenticated");
    }

    return res.json();
}

export const logout = async (): Promise<void> => {
    const res = await fetch(`${apiBaseUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Logout failed");
    }
}

export const updateProfile = async (fullName: string): Promise<MeResponse> => {
    const res = await fetch(`${apiBaseUrl}/auth/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fullName }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw error;
    }

    return res.json();
}

export const changePassword = async (
    currentPassword: string,
    newPassword: string,
): Promise<void> => {
    const res = await fetch(`${apiBaseUrl}/auth/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw error;
    }
}

export const forgotPassword = async (email: string): Promise<void> => {
    const res = await fetch(`${apiBaseUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw error;
    }
}

export const resetPassword = async (
    token: string,
    newPassword: string,
): Promise<void> => {
    const res = await fetch(`${apiBaseUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, newPassword }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw error;
    }
}

export const verifyEmail = async (token: string): Promise<void> => {
    const res = await fetch(`${apiBaseUrl}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw error;
    }
}

export const resendVerification = async (): Promise<{ sent: boolean }> => {
    const res = await fetch(`${apiBaseUrl}/auth/resend-verification`, {
        method: "POST",
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.json();
        throw error;
    }

    return res.json(); // { sent } — false if already verified
}

// Named deleteUserAccount (not deleteAccount) to avoid ambiguity with
// api/plaid.ts's deleteAccount, which deletes a single linked bank account.
export const deleteUserAccount = async (): Promise<void> => {
    const res = await fetch(`${apiBaseUrl}/auth/me`, {
        method: "DELETE",
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.json();
        throw error;
    }
}

export const googleAuthUrl = `${apiBaseUrl}/auth/google`;
