// SINGLE SOURCE of Assets instance shared everywhere.
// Reason: not a new one created by each import. 

import AssetManager from "./assetManager.js";
const assets = new AssetManager();
export default assets;
