import axios from "axios";

export const uploadFile = (data) =>
  axios.post("http://localhost:5000/upload", data);