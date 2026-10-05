import Env from "#Env";

/**
 * Helper function for generating URL to media CDN.
 */
export default (Base: string, Name: string): URL => {
    const MediaURL: URL = new URL(
        `${Env.GetVariable("BASE_MEDIA_URL")}/${Base}/${encodeURIComponent(Name).replace(/\ /g, "_")}.png`
    );
    MediaURL.pathname = MediaURL.pathname.replace(/\/+/g, "/");
    return MediaURL;
};