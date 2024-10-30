export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  
    try {
      const { account } = req.body;
      if (!account) {
        return res.status(400).json({ success: false, error: 'Account is required' });
      }
  
      // Your nonce logic here
      const nonce = 1;
      
      return res.status(200).json({ success: true, nonce });
    } catch (error) {
      console.error('Nonce API error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }