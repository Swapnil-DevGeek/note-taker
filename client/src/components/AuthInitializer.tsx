import { useInitializeAuth } from '@/state/actions/authActions';
import { useEffect } from 'react'
import { useSetRecoilState } from 'recoil';
import { authInitializedAtom } from '@/state/atoms/authInitializedAtom';

export default function AuthInitializer() {
    const initializeAuth = useInitializeAuth();
    const setAuthInitialized = useSetRecoilState(authInitializedAtom);
    
    useEffect(()=>{
        const init = async () => {
            try {
                await initializeAuth();
            } catch (error) {
                console.error("Auth initialization error:", error);
            } finally {
                setAuthInitialized(true);
            }
        };
        init();
    },[initializeAuth, setAuthInitialized])


  return null;
}
