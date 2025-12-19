import { atom } from "recoil";
import type { User } from "../../types/auth";

export const userAtom = atom<User | null>({
    key: 'userAtom',
    default: null,
});
