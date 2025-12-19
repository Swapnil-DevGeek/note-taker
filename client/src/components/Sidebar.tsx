import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotes, createNote, deleteNote } from '../lib/api';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { selectedNoteIdAtom } from '../state/atoms/selectedNoteIdAtom';
import { themeAtom } from '../state/atoms/themeAtom';
import { userAtom } from '../state/atoms/userAtom';
import { useNavigate, useParams } from 'react-router';
import { useLogoutUser } from '../state/actions/authActions';
import { 
    Plus, Trash2, Moon, Sun, 
    MoreVertical, User as UserIcon,
    FileText, LogOut, PanelLeftClose
} from 'lucide-react';
import { Button } from './ui/button';
import { sidebarOpenAtom } from '../state/atoms/sidebarOpenAtom';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { cn } from '../lib/utils';
import type { Note } from '../types';

export const Sidebar = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const setSelectedNoteId = useSetRecoilState(selectedNoteIdAtom);
    const [theme, setTheme] = useRecoilState(themeAtom);
    const [user, setUser] = useRecoilState(userAtom);
    const [sidebarOpen, setSidebarOpen] = useRecoilState(sidebarOpenAtom);
    const queryClient = useQueryClient();
    const logout = useLogoutUser();

    const { data: notes, isLoading } = useQuery<Note[]>({
        queryKey: ['notes'],
        queryFn: getNotes,
    });

    const createNoteMutation = useMutation({
        mutationFn: createNote,
        onSuccess: (newNote) => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            setSelectedNoteId(newNote._id);
            navigate(`/notebook/${newNote._id}`);
        },
    });

    const deleteNoteMutation = useMutation({
        mutationFn: deleteNote,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
            if (id) {
                setSelectedNoteId(null);
                navigate('/notebook');
            }
        },
    });

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const handleCreateNote = () => {
        createNoteMutation.mutate({ title: 'New Note', content: '' });
    };

    const handleNoteClick = (noteId: string) => {
        setSelectedNoteId(noteId);
        navigate(`/notebook/${noteId}`);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (!sidebarOpen) return null;

    return (
        <div className={cn(
            "w-72 h-screen flex flex-col border-r transition-all duration-300",
            theme === 'dark' ? 'bg-[#0a0a0a] border-zinc-900 text-zinc-400' : 'bg-zinc-50 border-zinc-100 text-zinc-600'
        )}>
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white dark:text-zinc-900" />
                    </div>
                    <span className="font-semibold text-zinc-900 dark:text-white tracking-tight">Notebook</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
                        {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="h-8 w-8">
                        <PanelLeftClose className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="px-4 py-4">
                <Button 
                    onClick={handleCreateNote}
                    className="w-full gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 h-9"
                    disabled={createNoteMutation.isPending}
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">New Page</span>
                </Button>
            </div>

            <Separator className="mx-4 w-auto bg-zinc-100 dark:bg-zinc-900" />

            {/* Navigation Groups */}
            <div className="px-2 py-4 space-y-4 flex-1 overflow-hidden flex flex-col">
                <div>
                    <div className="px-3 mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">All Notes</span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900">
                            {notes?.length || 0}
                        </span>
                    </div>
                    <ScrollArea className="h-[calc(100vh-250px)]">
                        <div className="space-y-0.5 px-2">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <div key={i} className="h-9 w-full bg-zinc-100/50 dark:bg-zinc-900/50 animate-pulse rounded-md" />
                                ))
                            ) : (
                                notes?.map((note) => (
                                    <div
                                        key={note._id}
                                        onClick={() => handleNoteClick(note._id)}
                                        className={cn(
                                            "group flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-200",
                                            id === note._id 
                                                ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-white ring-1 ring-zinc-200/50 dark:ring-zinc-800/50" 
                                                : "hover:bg-zinc-200/50 dark:hover:bg-zinc-900/50 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                                        )}
                                    >
                                        <FileText className={cn(
                                            "w-4 h-4 shrink-0",
                                            id === note._id ? "text-blue-500" : "text-zinc-400"
                                        )} />
                                        <span className="text-sm truncate font-medium">{note.title || 'Untitled'}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNoteMutation.mutate(note._id);
                                            }}
                                            className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* Profile Section */}
            <div className="mt-auto p-4">
                <Separator className="mb-4 bg-zinc-100 dark:bg-zinc-900" />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start gap-3 h-12 px-2 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/50 group">
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarFallback className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                                    {user?.email?.substring(0, 1).toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start text-left flex-1 min-w-0">
                                <span className={cn(
                                    "truncate w-full",
                                    theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'
                                )}>
                                    {user?.email || 'user@example.com'}
                                </span>
                            </div>
                            <MoreVertical className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
                        </Button>
                    </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56" side="right" sideOffset={12}>
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                            <UserIcon className="w-4 h-4" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50/10" onClick={handleLogout}>
                            <LogOut className="w-4 h-4" />
                            Log out
                        </DropdownMenuItem>
                      </DropdownMenuContent>

                </DropdownMenu>
            </div>
        </div>
    );
};
