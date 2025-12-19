import { useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { themeAtom } from '@/state/atoms/themeAtom';

export default function ThemeInitializer() {
    const theme = useRecoilValue(themeAtom);
    
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        
        // Update body background color based on theme
        if (theme === 'dark') {
            document.body.style.backgroundColor = '#121212';
        } else {
            document.body.style.backgroundColor = '#ffffff';
        }
    }, [theme]);

    return null;
}
