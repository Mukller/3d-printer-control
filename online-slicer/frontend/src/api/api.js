import axios from "axios";

// In dev: Vite proxy routes /upload, /print, /printer → localhost:3001
// In prod: set VITE_API_URL to your Pi's address
const API = import.meta.env.VITE_API_URL || "";

export const uploadFile = (data) => axios.post(`${API}/upload`, data);

export const sendToPrint = (settings) => axios.post(`${API}/print`, settings);

export const getPrinterStatus = () => axios.get(`${API}/printer/status`);
