import { atom } from "recoil";

const localStorageEffect = (key: string) => ({ setSelf, onSet }: any) => {
    const savedValue = localStorage.getItem(key);
    if (savedValue != null) {
        setSelf(savedValue);
    }

    onSet((newValue: any, _: any, isReset: boolean) => {
        isReset
            ? localStorage.removeItem(key)
            : localStorage.setItem(key, newValue as string);
    });
};

export const themeAtom = atom<'light' | 'dark'>({
    key: 'themeAtom',
    default: 'dark',
    effects: [
        localStorageEffect('theme'),
    ]
});
