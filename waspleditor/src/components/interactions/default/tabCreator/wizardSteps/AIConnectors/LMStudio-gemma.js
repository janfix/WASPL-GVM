export default {
    apiUrl: 'http://localhost:1234/v1/chat/completions',
    requestPayload: {
      model: 'gemma-3-27b-it',
      messages: [
        { role: 'system', content: 'Always answer in rhymes. Today is Thursday' }
      ],
      temperature: 0.7,
      max_tokens: -1,
      stream: false,
    }
  };
  