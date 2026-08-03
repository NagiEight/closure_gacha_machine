import GetMediaURL from "../helpers/GetMediaURL.js";
import MakeAPICall from "../helpers/MakeAPICall.js";

// Wrapper class for api calls
export default new class {
    public async GetBannerPage(Page: number): Promise<Response> {
        return await MakeAPICall(`/api/banners/${Page}`);
    }
    public async GetBannerDetails(BannerName: string): Promise<Response> {
        return await MakeAPICall(`/api/banner/${BannerName}`);
    }
    public async GetOperatorDetails(ID: string): Promise<Response> {
        return await MakeAPICall(`/api/operator/${ID}`);
    }
    public async GetAllBannerNames(): Promise<Response> {
        return await MakeAPICall("/api/banners/all");
    }

    public async GetBannerCoverURL(BannerName: string): Promise<Response> {
        return await GetMediaURL("banner", BannerName);
    }
    public async GetOperatorE0ArtURL(ID: string): Promise<Response> {
        return await GetMediaURL("operator", ID);
    }
    public async GetOperatorE2ArtURL(ID: string): Promise<Response> {
        return await GetMediaURL("e2operator", ID);
    }
    public async GetOperatorCardURL(ID: string): Promise<Response> {
        return await GetMediaURL("card", ID);
    }

    public async CreateToken(): Promise<Response> {
        return await MakeAPICall("/gacha/create", "POST");
    }
    public async GetProfile(Token: string): Promise<Response> {
        return await MakeAPICall("/gacha/profile", "GET", Token);
    }
    public async Roll(BannerName: string, Token: string): Promise<Response> {
        return await MakeAPICall(`/gacha/${BannerName}/roll`, "POST", Token);
    }
    public async RollMulti(BannerName: string, Count: number, Token: string): Promise<Response> {
        return await MakeAPICall(`/gacha/${BannerName}/roll/${Count}?reduced=true`, "POST", Token);
    }
    public async DeleteToken(Token: string): Promise<Response> {
        return await MakeAPICall("/gacha/delete", "PURGE", Token);
    }
}();