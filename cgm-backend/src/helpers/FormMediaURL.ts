import LoadEnv from "#LoadEnv";

export default (Base: string, Name: string): string => {
    const MediaURL: URL = new URL(`${LoadEnv.BASE_MEDIA_URL}/${Base}/${encodeURIComponent(Name).replace(/\ /g, "_")}.png`);
    MediaURL.pathname = MediaURL.pathname.replace(/\/+/g, '/');
    return MediaURL.toString();
};