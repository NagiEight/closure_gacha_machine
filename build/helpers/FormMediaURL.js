import Env from "commaenv";
/**
 * Helper function for generating URL to media CDN.
 */
export default (Base, Name) => {
    const MediaURL = new URL(`${Env.GetVariable("BASE_MEDIA_URL")}/${Base}/${encodeURIComponent(Name).replace(/\ /g, "_")}.png`);
    MediaURL.pathname = MediaURL.pathname.replace(/\/+/g, "/");
    return MediaURL;
};
