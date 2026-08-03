import LoadEnv from "../singletons/LoadEnv.js";

export default async (Path: string, Method: string = "GET", Token?: string): Promise<Response> => {
    const FetchURL: URL = new URL(`${LoadEnv.BASE_API_URL}/${Path}`);
    FetchURL.pathname = FetchURL.pathname.replace(/\/+/g, '/');
    return fetch(
        FetchURL,
        {
            method: Method,
            headers: {
                "Session-Token": Token ?? ""
            }
        }
    );
};