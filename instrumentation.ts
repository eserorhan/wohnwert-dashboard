export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getMapData, getDetailData } = await import("./lib/db");

    try {
      const t = Date.now();
      getMapData();
      console.log(`[warmup] properties_map.json geladen in ${Date.now() - t}ms`);
    } catch (e) {
      console.warn("[warmup] map JSON fehlgeschlagen:", e);
    }

    setTimeout(() => {
      try {
        const t = Date.now();
        getDetailData();
        console.log(`[warmup] properties_detail.json geladen in ${Date.now() - t}ms`);
      } catch (e) {
        console.warn("[warmup] detail JSON fehlgeschlagen:", e);
      }
    }, 3000);
  }
}
