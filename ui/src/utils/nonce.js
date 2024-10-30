import api from "./serverless/api"
export async function getNonce(account) {
  try {
    const result = await api.nonce(account);
    console.log("getNonce result:", result);
    
    if (!result || result.success === false) {
      console.warn("Failed to get nonce:", result?.error || 'Unknown error');
      return -1;
    }
    
    const nonce = parseInt(result.nonce);
    if (isNaN(nonce)) {
      console.warn("Invalid nonce received:", result.nonce);
      return -1;
    }
    
    return nonce;
  } catch (error) {
    console.error("getNonce error:", error);
    return -1;
  }
}