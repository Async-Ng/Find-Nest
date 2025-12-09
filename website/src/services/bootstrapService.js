// ...existing code...
import { publicApi, userApi } from "./api"
export const bootstrapFetch = async ({ allowPartial = true } = {}) => {
    const safe = (p) => p.then((res) => res).catch((err) => ({ __error: err }));

    const [favRes, listingRes, profileRes] = await Promise.all([
        safe(publicApi.getFavorites()),
        safe(userApi.getListings()),
        safe(userApi.getProfile()),
    ]);

    if (favRes && favRes.__error) console.warn("getFavorites failed:", favRes.__error);
    if (listingRes && listingRes.__error) console.warn("getListings failed:", listingRes.__error);
    if (profileRes && profileRes.__error) console.warn("getProfile failed:", profileRes.__error);

    const extract = (res, fallback) => {
        if (!res) return fallback;
        if (res.__error) {
            if (allowPartial) return fallback;
            throw res.__error;
        }
        return res?.data ?? res ?? fallback;
    };

    return {
        favorites: extract(favRes, []),
        listings: extract(listingRes, []),
        profile: extract(profileRes, null),
    };
};
// ...existing code...