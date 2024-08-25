import config from "@/config/config.json";
import axios from "axios";

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
type newProjectMembershipType = {
  user_id: number;
  project_id: number;
};

type newImageType = {
  name: string;
  project_id_form: number;
  image_file: File;
};

type projectType = {
  id: number;
  name: string;
  owner_id: number;
  description: string;
  root_folder_path: string;
  images_folder_path: string;
  object_images_folder_path: string;
  joined: boolean;
  created_at: string;
  updated_at: string;
};

type projectMembershipType = {
  user_id: number;
  project_id: number;
  created_at: string;
  updated_at: string;
};

type projectMembershipParamType = {
  user_id: number | null;
  project_id: number | null;
};

type loginUserType = {
  email: string;
  name: string;
  password: string;
};

type joinUserType = {
  user_id: number;
  project_id: number;
  project_password: string;
};
//汎用的なデータ一覧取得処理
const getData = async (url: string, params: any) => {
  try {
    const response = await axios.get(url, {
      params: params,
    });
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

//ユーザとプロジェクトの紐付けを取得する
//基本的にproject_idかuser_idにnullを指定する
const getProjectMembership = async (params: projectMembershipParamType) => {
  try {
    const url = `${config.backend_base_url}/project_memberships`;
    const response = await axios.get(url, {
      params: params,
    });
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

//プロジェクトユーザ紐づけ作成
const postProjectMembership = async (
  newProjectMembership: newProjectMembershipType
) => {
  try {
    const url = `${config.backend_base_url}/project_memberships`;
    const response = await axios.post(url, newProjectMembership);
    return response;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response;
    }
    return Promise.reject(error);
  }
};

//新たな画像のアップロード
const postImage = async (newImage: newImageType) => {
  try {
    const url = `${config.backend_base_url}/images/${newImage.project_id_form}`;

    // FormData を作成してデータを追加
    const formData = new FormData();
    formData.append("name", newImage.name);
    formData.append("project_id_form", newImage.project_id_form.toString());
    formData.append("image_file", newImage.image_file);

    const response = await axios.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response;
    }
    return Promise.reject(error);
  }
};

//restから外れたアクション処理//

//ログイン処理
const executeLogin = async (loginUser: loginUserType) => {
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

const executeJoinProject = async (
  project_id: number,
  joinUser: joinUserType
) => {
  try {
    const url = `${config.backend_base_url}/auth/join/${project_id}`;
    const response = await axios.post(url, joinUser);
    return response;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response;
    }
    return Promise.reject(error);
  }
};
export type {
  signupUserType,
  newProjectType,
  newProjectMembershipType,
  newImageType,
  projectMembershipType,
  projectMembershipParamType,
  projectType,
  loginUserType,
  joinUserType,
};
export {
  getData,
  getProject,
  getProjectMembership,
  postUser,
  postProjectMembership,
  postProject,
  postImage,
  executeLogin,
  executeJoinProject,
};
