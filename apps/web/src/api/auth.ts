import { apiBaseUrl } from "./index";

export const login = async (email: string, password: string) => {
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

    return res;
}

export const register = async(email: string, password: string, fullName: string) => {
    const res = await fetch(`${apiBaseUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, fullName }),
      });

      if(!res.ok){
        const error = await res.json();
        throw error;
    }

    return res;

}

export const googleAuthUrl = `${apiBaseUrl}/auth/google`;