import { SignUpFormData, LoginFormData} from "../types/auth.types";
import api from "./axiosConfig";

export const registerUser = async (userData: SignUpFormData) => {
  try {
const username = userData.firstName + " " + userData.lastName;
const payload = {
  username,
  email: userData.email,
  phone_number: userData.phone_number,
  password: userData.password,
};
// console.log("Registering user with payload:", payload);

    const response = await api.post("/auth/register", payload);
    return response.data;
  } catch (error) {
    // console.error("Registration error:", error);
    throw error;
  }
};


export const loginUser = async (credentials:LoginFormData) => {
    try {
      console.log("Logging in with credentials:", credentials);
           const response = await api.post("/auth/login", credentials);
          //  console.log("Login API response:", response);
        return response.data;



    }catch (error) {
        // console.error("Login error:", error);
        throw error;
    }

}



