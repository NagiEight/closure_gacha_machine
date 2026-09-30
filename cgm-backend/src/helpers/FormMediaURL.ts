import LoadEnv from "#LoadEnv";

/**
 * Helper function for generating URL to media cdn.
 */
export default (Base: string, Name: string): URL => {
    const MediaURL: URL = new URL(`${LoadEnv.BASE_MEDIA_URL}/${Base}/${encodeURIComponent(Name).replace(/\ /g, "_")}.png`);
    MediaURL.pathname = MediaURL.pathname.replace(/\/+/g, "/");
    return MediaURL;
};