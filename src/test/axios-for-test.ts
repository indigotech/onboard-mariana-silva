import axios from "axios";

const testAxios = axios.create({
  validateStatus: () => true, // Todos os status codes serão considerados válidos
});

export default testAxios;
