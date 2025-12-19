import React, { useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Editor } from '../components/Editor';
import { useRecoilState, useRecoilValue } from 'recoil';
import { themeAtom } from '../state/atoms/themeAtom';
import { useParams } from 'react-router';
import { selectedNoteIdAtom } from '../state/atoms/selectedNoteIdAtom';

const Notebook = () => {
    const theme = useRecoilValue(themeAtom);
    const { id } = useParams();
    const [selectedNoteId, setSelectedNoteId] = useRecoilState(selectedNoteIdAtom);

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
