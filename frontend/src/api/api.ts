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
  project_id: number;
  uploaded_user_id: number;
  image_file: File;
};
type projectType = {
  id: number;
  name: string;
  owner_id: number;
  description: string;
  root_folder_id: string;
  original_images_folder_path: string;
  init_clustering_state: number;
  mongo_result_id: string;
  joined: boolean;
};

type projectMembershipType = {
  user_id: number;
  project_id: number;
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
const getProject = async (id: string, user_id: number) => {
  try {
    const url = `${config.backend_base_url}/projects/${id}?user_id=${user_id}`;
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

const getImagesInProject = async (project_id: number) => {
  try {
    const url = `${config.backend_base_url}/images`;
    const response = await axios.get(url, {
      params: { project_id },
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
    const url = `${config.backend_base_url}/images`;

    const formData = new FormData();
    formData.append("project_id", newImage.project_id.toString());
    formData.append("uploaded_user_id", newImage.uploaded_user_id.toString());
    formData.append("file", newImage.image_file);

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

const executeInitClustering = async (project_id: number, user_id: number) => {
  try {
    const url = `${config.backend_base_url}/action/clustering/init/${project_id}?user_id=${user_id}`;
    const response = await axios.get(url);
    return response;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response;
    }
  }
};

const getClusteringResult = async (mongo_result_id: string) => {
  try {
    const url = `${config.backend_base_url}/action/clustering/result/${mongo_result_id}`;
    console.log("=== getClusteringResult API Request ===");
    console.log("URL:", url);
    console.log("mongo_result_id:", mongo_result_id);

    const response = await axios.get(url);
    console.log("=== getClusteringResult API Response ===");
    console.log("Full response:", response);
    console.log("Response data:", response.data);
    console.log("Response data type:", typeof response.data);
    console.log("Response status:", response.status);

    if (response.data && typeof response.data === "object") {
      console.log("Response data keys:", Object.keys(response.data));
      if (response.data.result) {
        console.log("result field exists:", response.data.result);
        console.log("result type:", typeof response.data.result);
        if (typeof response.data.result === "object") {
          console.log("result keys:", Object.keys(response.data.result));
        }
      } else {
        console.log("❌ result field not found in response.data");
      }
    }

    // バックエンドから直接dataが返されるので、response.dataを返す
    return response.data;
  } catch (error) {
    console.error("=== getClusteringResult API Error ===");
    console.error("Error:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      return error.response;
    }
    return Promise.reject(error);
  }
};

const moveClusteringItems = async (
  mongo_result_id: string,
  source_type: "folders" | "images",
  sources: string[],
  destination_folder: string
) => {
  try {
    const url = `${config.backend_base_url}/action/clustering/move/${mongo_result_id}`;

    // パラメータを手動で構築して配列の形式を制御
    const params = new URLSearchParams();
    params.append("source_type", source_type);
    params.append("destination_folder", destination_folder);

    // 配列の各要素を個別に追加
    sources.forEach((source) => {
      params.append("sources", source);
    });

    console.log("=== API呼び出し詳細 ===");
    console.log("URL:", url);
    console.log("params:", params.toString());

    const response = await axios.put(url, null, {
      params: params,
    });
    return response.data;
  } catch (error) {
    console.error("=== API呼び出しエラー ===");
    console.error("error:", error);
    console.error("error.response:", error?.response);
    console.error("error.response?.data:", error?.response?.data);
    console.error("error.response?.status:", error?.response?.status);

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
  getImagesInProject,
  postUser,
  postProjectMembership,
  postProject,
  postImage,
  executeLogin,
  executeJoinProject,
  executeInitClustering,
  getClusteringResult,
  moveClusteringItems,
};
