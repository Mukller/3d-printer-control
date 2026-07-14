import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const uploadFile = (data) => axios.post(`${API}/upload`, data);

export const sendToPrint = (settings) => axios.post(`${API}/print`, settings);

export const getPrinterStatus = () => axios.get(`${API}/printer/status`);
