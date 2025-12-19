import { selector } from "recoil";
import { userAtom } from "../atoms/userAtom";

export const userSelector = selector({
    key: 'userSelector',
    get: ({get}) => {
        const user = get(userAtom);
        return user;
    },
});