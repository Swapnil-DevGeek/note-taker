import axios from 'axios';
import type { Note } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

export const getNotes = async (): Promise<Note[]> => {
  const response = await api.get('/notes');
  return response.data;
};

export const getNote = async (id: string): Promise<Note> => {
  const response = await api.get(`/notes/${id}`);
  return response.data;
};

export const createNote = async (data: { title: string; content: string }): Promise<Note> => {
  const response = await api.post('/notes', data);
  return response.data;
};

export const updateNote = async ({ id, title, content }: { id: string; title: string; content: string }): Promise<Note> => {
  const response = await api.put(`/notes/${id}`, { title, content });
  return response.data;
};

export const deleteNote = async (id: string): Promise<void> => {
  await api.delete(`/notes/${id}`);
};

export default api;
