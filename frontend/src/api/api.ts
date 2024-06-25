import config from "@/config/config.json";
import axios from "axios";
import { log } from "console";

type signupUserType = {
  email: string;
  name: string;
  password: string;
  authority: boolean;
};
type newProjectType = {
  name: string;
  password: string;
  description: string;
  owner_id: number;
};

type projectType = {
  id: number;
  name: string;
  password: string;
  description: string;
  created_at: string;
  updated_at: string;
};
type loginpUserType = {
  email: string;
  name: string;
  password: string;
};
//汎用的なデータ一覧取得処理
const getData = async (url: string) => {
  try {
    const response = await axios.get(url);
    return response.data; // レスポンスのデータ部分のみを返す
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Error response:", error.response);
      throw error.response; // エラーレスポンスを投げる
    } else {
      console.error("Error:", error);
      throw error; // その他のエラーを投げる
    }
  }
};
const getProject = async (id: string) => {
  try {
    const url = `${config.backend_base_url}/projects/${id}`;
    const response = await axios.get(url);
    return response.data; // レスポンスのデータ部分のみを返す
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Error response:", error.response);
      throw error.response; // エラーレスポンスを投げる
    } else {
      console.error("Error:", error);
      throw error; // その他のエラーを投げる
    }
  }
};

//ユーザ新規登録
const postUser = async (signupUser: signupUserType) => {
  try {
    const url = `${config.backend_base_url}/users`;
    const response = await axios.post(url, signupUser);
    return response;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response;
    }
    return Promise.reject(error);
  }
};

//プロジェクト新規作成
const postProject = async (newProject: newProjectType) => {
  try {
    const url = `${config.backend_base_url}/projects`;
    const response = await axios.post(url, newProject);
    return response;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response;
    }
    return Promise.reject(error);
  }
};

//restから外れたアクション処理

//ログイン処理
const executeLogin = async (loginUser: loginpUserType) => {
  try {
    const url = `${config.backend_base_url}/auth/login`;
    const response = await axios.post(url, loginUser);
    return response;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response;
    }
    return Promise.reject(error);
  }
};
export type { signupUserType, newProjectType, projectType, loginpUserType };
export { getData, getProject, postUser, postProject, executeLogin };
