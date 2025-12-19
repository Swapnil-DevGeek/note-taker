import { atom } from "recoil";

export const selectedNoteIdAtom = atom<string | null>({
    key: 'selectedNoteIdAtom',
    default: null,
});
