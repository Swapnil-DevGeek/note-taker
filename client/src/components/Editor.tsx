import React, { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Typography from '@tiptap/extension-typography';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { SlashCommand, suggestion } from './editor/SlashCommand';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNote, updateNote } from '../lib/api';
import { useRecoilValue } from 'recoil';
import { selectedNoteIdAtom } from '../state/atoms/selectedNoteIdAtom';
import { themeAtom } from '../state/atoms/themeAtom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { 
    Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
    AlignLeft, AlignCenter, AlignRight, AlignJustify, 
    Undo, Redo, Link as LinkIcon, Download, Info, PanelLeftOpen
} from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from '../lib/utils';
import { useRecoilState } from 'recoil';
import { sidebarOpenAtom } from '../state/atoms/sidebarOpenAtom';


export const Editor = () => {
    const selectedNoteId = useRecoilValue(selectedNoteIdAtom);
    const theme = useRecoilValue(themeAtom);
    const [sidebarOpen, setSidebarOpen] = useRecoilState(sidebarOpenAtom);
    const queryClient = useQueryClient();
    const [debouncedContent, setDebouncedContent] = useState('');

    const { data: note, isLoading } = useQuery({
        queryKey: ['note', selectedNoteId],
        queryFn: () => getNote(selectedNoteId!),
        enabled: !!selectedNoteId,
    });

    const updateNoteMutation = useMutation({
        mutationFn: updateNote,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
        },
    });

    const formik = useFormik({
        initialValues: {
            title: note?.title || '',
        },
        enableReinitialize: true,
        validationSchema: Yup.object({
            title: Yup.string().max(100, 'Title too long'),
        }),
        onSubmit: (values) => {
            if (selectedNoteId) {
                updateNoteMutation.mutate({
                    id: selectedNoteId,
                    title: values.title || 'Untitled',
                    content: editor?.getHTML() || '',
                });
            }
        },
    });

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
                codeBlock: false, // Use CodeBlockLowlight instead
            }),
            Typography,
            Image,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            CodeBlockLowlight.configure({
                lowlight: createLowlight(common),
            }),
            SlashCommand.configure({
                suggestion,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Placeholder.configure({
                placeholder: ({ node }) => {
                    if (node.type.name === 'heading') {
                        return 'What\'s the title?';
                    }
                    return 'Start typing or use markdown shortcuts (# for H1, - for list)...';
                },
            }),
        ],
        content: note?.content || '',
        editorProps: {
            attributes: {
                class: cn(
                    'prose focus:outline-none max-w-none min-h-[500px] pb-32 transition-colors duration-300',
                    theme === 'dark' ? 'prose-invert' : ''
                ),
            },
        },
        onUpdate: ({ editor }) => {
            setDebouncedContent(editor.getHTML());
        },
    }, [selectedNoteId === null]); // Only re-run if it was null and now it's not, or vice versa, but actually useEditor should be stable.

    useEffect(() => {
        if (note && editor && selectedNoteId) {
            if (editor.getHTML() !== note.content) {
                editor.commands.setContent(note.content);
            }
        }
    }, [note?.content, editor, selectedNoteId]);

    useEffect(() => {
        if (editor) {
            editor.setOptions({
                editorProps: {
                    attributes: {
                        class: cn(
                            'prose focus:outline-none max-w-none min-h-[500px] pb-32 transition-colors duration-300',
                            theme === 'dark' ? 'prose-invert' : ''
                        ),
                    },
                },
            });
        }
    }, [theme, editor]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (selectedNoteId && (debouncedContent || formik.values.title !== note?.title)) {
                updateNoteMutation.mutate({
                    id: selectedNoteId,
                    title: formik.values.title || 'Untitled',
                    content: editor?.getHTML() || '',
                });
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [debouncedContent, formik.values.title]);

    const setLink = useCallback(() => {
        const previousUrl = editor?.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) {
            return;
        }

        if (url === '') {
            editor?.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    const exportAsMarkdown = () => {
        if (!editor || !note) return;
        
        // Simple HTML to Markdown conversion for basic tags
        let content = editor.getHTML();
        content = content.replace(/<h1>(.*?)<\/h1>/g, '# $1\n');
        content = content.replace(/<h2>(.*?)<\/h2>/g, '## $1\n');
        content = content.replace(/<h3>(.*?)<\/h3>/g, '### $1\n');
        content = content.replace(/<p>(.*?)<\/p>/g, '$1\n\n');
        content = content.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
        content = content.replace(/<em>(.*?)<\/em>/g, '*$1*');
        content = content.replace(/<ul>(.*?)<\/ul>/g, '$1');
        content = content.replace(/<li>(.*?)<\/li>/g, '- $1\n');
        content = content.replace(/<br\s*\/?>/g, '\n');
        content = content.replace(/<[^>]*>/g, ''); // Strip remaining tags
        
        const blob = new Blob([`# ${formik.values.title}\n\n${content}`], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formik.values.title || 'note'}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!selectedNoteId) {
        return (
            <div className={cn(
                "flex-1 flex flex-col items-center justify-center transition-colors duration-300",
                theme === 'dark' ? 'bg-[#0f0f0f] text-zinc-500' : 'bg-zinc-50 text-zinc-400'
            )}>
                <div className="max-w-md text-center px-6">
                    <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Info className="w-8 h-8 opacity-20" />
                    </div>
                    <h2 className="text-xl font-medium mb-2 text-zinc-900 dark:text-zinc-100">No note selected</h2>
                    <p className="text-sm">Choose a note from the sidebar or create a new one to start your creative process.</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className={cn(
                "flex-1 p-20",
                theme === 'dark' ? 'bg-[#0f0f0f]' : 'bg-white'
            )}>
                <div className="max-w-4xl mx-auto animate-pulse space-y-8">
                    <div className="h-14 bg-zinc-100 dark:bg-zinc-900 rounded-lg w-3/4"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-zinc-100 dark:bg-zinc-900 rounded w-full"></div>
                        <div className="h-4 bg-zinc-100 dark:bg-zinc-900 rounded w-full"></div>
                        <div className="h-4 bg-zinc-100 dark:bg-zinc-900 rounded w-5/6"></div>
                    </div>
                </div>
            </div>
        );
    }

    const ShortcutItem = ({ keys, label }: { keys: string[], label: string }) => (
        <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <div className="flex gap-1">
                {keys.map(k => (
                    <kbd key={k} className="px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-[10px] font-medium min-w-[20px] text-center">
                        {k}
                    </kbd>
                ))}
            </div>
            <span>{label}</span>
        </div>
    );

    return (
        <div className={cn(
            "flex-1 flex flex-col h-screen overflow-hidden transition-colors duration-300 relative",
            theme === 'dark' ? 'bg-[#0f0f0f] text-zinc-100' : 'bg-white text-zinc-900'
        )}>
            {/* Top Toolbar */}
            <div className={cn(
                "h-14 px-6 flex items-center justify-between border-b z-10",
                theme === 'dark' ? 'border-zinc-900 bg-[#0f0f0f]/80' : 'border-zinc-100 bg-white/80',
                "backdrop-blur-md"
            )}>
                <div className="flex items-center gap-1">
                    {!sidebarOpen && (
                        <>
                            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="h-8 w-8 mr-2">
                                <PanelLeftOpen className="w-4 h-4" />
                            </Button>
                            <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mr-2" />
                        </>
                    )}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()}>
                                    <Undo className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Undo</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()}>
                                    <Redo className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Redo</TooltipContent>
                        </Tooltip>
                        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-2" />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant={editor?.isActive('bold') ? 'secondary' : 'ghost'} 
                                    size="icon" 
                                    onClick={() => editor?.chain().focus().toggleBold().run()}
                                >
                                    <Bold className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Bold (⌘B)</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant={editor?.isActive('italic') ? 'secondary' : 'ghost'} 
                                    size="icon" 
                                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                                >
                                    <Italic className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Italic (⌘I)</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant={editor?.isActive('underline') ? 'secondary' : 'ghost'} 
                                    size="icon" 
                                    onClick={() => editor?.chain().focus().toggleUnderline().run()}
                                >
                                    <UnderlineIcon className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Underline (⌘U)</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant={editor?.isActive('strike') ? 'secondary' : 'ghost'} 
                                    size="icon" 
                                    onClick={() => editor?.chain().focus().toggleStrike().run()}
                                >
                                    <Strikethrough className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Strikethrough (⌘⇧X)</TooltipContent>
                        </Tooltip>
                        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-2" />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant={editor?.isActive({ textAlign: 'left' }) ? 'secondary' : 'ghost'} 
                                    size="icon" 
                                    onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                                >
                                    <AlignLeft className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Align Left</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant={editor?.isActive({ textAlign: 'center' }) ? 'secondary' : 'ghost'} 
                                    size="icon" 
                                    onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                                >
                                    <AlignCenter className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Align Center</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant={editor?.isActive({ textAlign: 'right' }) ? 'secondary' : 'ghost'} 
                                    size="icon" 
                                    onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                                >
                                    <AlignRight className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Align Right</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant={editor?.isActive({ textAlign: 'justify' }) ? 'secondary' : 'ghost'} 
                                    size="icon" 
                                    onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                                >
                                    <AlignJustify className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Justify</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="h-8 gap-2" onClick={exportAsMarkdown}>
                        <Download className="w-3.5 h-3.5" />
                        Export
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto px-12 py-8">
                    <form onSubmit={formik.handleSubmit} className="mb-6">
                        <input
                            name="title"
                            type="text"
                            placeholder="Page Title"
                            className={cn(
                                "text-4xl font-bold bg-transparent border-none outline-none w-full placeholder:text-zinc-200 dark:placeholder:text-zinc-800",
                                theme === 'dark' ? 'text-white' : 'text-zinc-900',
                                formik.errors.title && "text-red-500"
                            )}
                            value={formik.values.title}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />
                    </form>
                    
                    <div className="relative">
                        <EditorContent editor={editor} />
                        
                        {editor?.isEmpty && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-700 bg-white/50 dark:bg-[#0f0f0f]/50 p-8 rounded-2xl backdrop-blur-sm border border-zinc-100 dark:border-zinc-900 pointer-events-auto">
                                    <p className="text-zinc-400 dark:text-zinc-500 text-xs font-medium uppercase tracking-widest text-center mb-4">Keyboard Shortcuts</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-10">
                                        <ShortcutItem keys={['#', 'space']} label="H1" />
                                        <ShortcutItem keys={['##', 'space']} label="H2" />
                                        <ShortcutItem keys={['###', 'space']} label="H3" />
                                        <ShortcutItem keys={['-', 'space']} label="List" />
                                        <ShortcutItem keys={['>', 'space']} label="Quote" />
                                        <ShortcutItem keys={['⌘', 'B']} label="Bold" />
                                        <ShortcutItem keys={['⌘', 'I']} label="Italic" />
                                        <ShortcutItem keys={['⌘', 'U']} label="Underline" />
                                        <ShortcutItem keys={['`']} label="Code" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {editor && (
                <BubbleMenu editor={editor} className="flex bg-zinc-900 text-white rounded-lg shadow-xl border border-zinc-800 overflow-hidden">
                    <button 
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={cn("p-2 hover:bg-zinc-800", editor.isActive('bold') && "text-blue-400")}
                    >
                        <Bold className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={cn("p-2 hover:bg-zinc-800", editor.isActive('italic') && "text-blue-400")}
                    >
                        <Italic className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        className={cn("p-2 hover:bg-zinc-800", editor.isActive('underline') && "text-blue-400")}
                    >
                        <UnderlineIcon className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={setLink}
                        className={cn("p-2 hover:bg-zinc-800", editor.isActive('link') && "text-blue-400")}
                    >
                        <LinkIcon className="w-4 h-4" />
                    </button>
                </BubbleMenu>
            )}
        </div>
    );
};
