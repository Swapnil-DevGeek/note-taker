import { selector } from "recoil";
import { userAtom } from "../atoms/userAtom";
import { tokenAtom } from "../atoms/tokenAtom";

export const isAuthSelector = selector({
  key: 'isAuthSelector',
  get: ({get}) => {
      const user = get(userAtom);
      const token = get(tokenAtom);
      return Boolean(token && user);
  }
});