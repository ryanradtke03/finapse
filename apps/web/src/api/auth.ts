import type { AuthResponse, User } from "@finapse/types";
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

export const googleAuthUrl = `${apiBaseUrl}/auth/google`;

export const fetchMe = async (): Promise<User> => {
    const res = await fetch(`${apiBaseUrl}/auth/me`, {
        credentials: "include",
    });

    if (!res.ok) throw new Error("Not authenticated");

    const data = await res.json();
    return data.user;
}

export const logoutUser = async (): Promise<void> => {
    await fetch(`${apiBaseUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
    });
}