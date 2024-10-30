const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

const handleResponse = async (response) => {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const fetchWithTimeout = async (url, options, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

const winston = async (info) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/winston`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(info),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Winston API error:', error);
    return { success: false, error: error.message };
  }
};

const nonce = async (account) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/nonce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ account }),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Nonce API error:', error);
    return { success: false, error: error.message };
  }
};

const storage = async () => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/storage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Storage API error:', error);
    return { success: false, error: error.message };
  }
};

export default {
  winston,
  storage,
  nonce,
};