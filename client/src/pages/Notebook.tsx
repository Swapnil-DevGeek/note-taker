import { useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Editor } from '../components/Editor';
import { useRecoilState } from 'recoil';
import { useParams } from 'react-router';
import { selectedNoteIdAtom } from '../state/atoms/selectedNoteIdAtom';
import { useSync } from '../hooks/useSync';

const Notebook = () => {
    const { id } = useParams();
    const [selectedNoteId, setSelectedNoteId] = useRecoilState(selectedNoteIdAtom);
    
    // Initialize sync service
    useSync();

    useEffect(() => {
        if (id && id !== selectedNoteId) {
            setSelectedNoteId(id);
        }
    }, [id, setSelectedNoteId, selectedNoteId]);

    return (
        <div className="flex h-screen w-full overflow-hidden">
            <Sidebar />
            <Editor />
        </div>
    );
};

export default Notebook;

