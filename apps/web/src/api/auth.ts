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

export const googleAuthUrl = `${apiBaseUrl}/auth/google`;
