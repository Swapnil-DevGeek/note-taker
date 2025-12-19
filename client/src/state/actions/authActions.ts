import axios from "axios"
import { useRecoilCallback } from "recoil";
import { userAtom } from "../atoms/userAtom";
import { tokenAtom } from "../atoms/tokenAtom";
import type { User } from "../../types/auth";

const API_URL = "http://localhost:8000";

export const useLoginUser = () => {
    return useRecoilCallback( ({set}) => async (user: User)=>{
        set(userAtom, user);
    } )
};

export const useLogoutUser = () => {
    return useRecoilCallback(({reset})=> ()=> {
        reset(userAtom);
        reset(tokenAtom);
        localStorage.removeItem("token");
    })
};

export const useInitializeAuth = () => {
    return useRecoilCallback(({ set, reset }) => async () => {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const response = await axios.get(`${API_URL}/api/user`, {
              headers: { Authorization: token }
            });
            set(userAtom, response.data.user);
            set(tokenAtom, token);
          } catch (error) {
            localStorage.removeItem("token");
            reset(userAtom);
            set(tokenAtom, null);
          }
        }
    });
};
