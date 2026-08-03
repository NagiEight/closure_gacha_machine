import MakeAPICall from "./MakeAPICall.js";

export default async (Base: string, Name: string): Promise<Response> => await MakeAPICall(`/assets/${Base}/${encodeURIComponent(Name.replace(/\ /g, "_"))}.png`);