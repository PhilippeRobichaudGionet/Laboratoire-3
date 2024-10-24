import * as utilities from "./utilities.js";
import * as serverVariables from "./serverVariables.js";

let CachesExpirationTime = serverVariables.get("main.repository.CacheExpirationTime");
globalThis.RequestedCaches = [];
global.cachedCleanerStarted = false

export class CachedRequestsManager {

    static startCachedRequestCleaner(){
        setInterval(CachedRequestsManager.flushExpired, CachesExpirationTime * 1000);
        console.log(BgWhite + FgBlue, "[Periodic repositories data caches cleaning process started...]");
    }

    static add(url, content, ETag=""){
        if (!cachedCleanerStarted) {
            cachedCleanerStarted = true;
            CachedRequestsManager.startCachedRequestCleaner();
        }

        if (url != "") {
            CachedRequestsManager.clear(url);
            RequestedCaches.push({
                url,
                content,
                ETag,
                Expire_Time: utilities.nowInSeconds() + CachesExpirationTime
            });
            console.log(BgWhite + FgBlue, `[Data of ${url} repository has been cached]`);
        }
    }

    static find(url){
        try{
            if (url != ""){
                for(let cache of RequestedCaches){
                    if (cache.url == url){
                        cache.Expire_Time = utilities.nowInSeconds() + CachesExpirationTime;
                        console.log(BgWhite + FgBlue, `[${cache.url} data retrieved from cache]`);
                        return cache.data;
                    }
                }
            }
        }
        catch (error) { console.log(BgWhite+FgRed, "[cache error!]", error); }
        return null;
    }

    static clear(url){
        if (url != "") {
            let indexToDelete = [];
            let index = 0;
            for (let cache of RequestedCaches) {
                if (cache.url == url) indexToDelete.push(index);
                index++;
            }
            utilities.deleteByIndex(RequestedCaches, indexToDelete);
        }
    }

    static flushExpired(){
        let now = utilities.nowInSeconds();
        for (let cache of RequestedCaches) {
            if (cache.Expire_Time <= now) {
                console.log(BgWhite + FgBlue, "Cached file data of " + cache.url + ".json expired");
            }
        }
        repositoryCaches = repositoryCaches.filter( cache => cache.Expire_Time > now);
    }

    static get(HttpContext){
        let Data = CachedRequestsManager.find(HttpContext.req.url)
        if (Data != null){
            HttpContext.response.JSON(Data.content, Data.Etag, true)
        }
        else{
            CachedRequestsManager.add(HttpContext.req.url,HttpContext.payload,HttpContext.req.ETag);
        }
    }
}