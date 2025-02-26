// Research service for web search functionality

export const searchWeb = async (query, apiKey) => {
  // This is a simplified implementation
  // In a real app, you would use a real search API
  // For this demo, we'll use OpenAI to generate mock search results
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful research assistant. Generate 3-5 search results for the query. 
            Format each result as a JSON object with title, snippet, and link properties. 
            Make the results educational and suitable for learning.
            Return ONLY a JSON array of results with no additional text.`
          },
          {
            role: 'user',
            content: `Generate search results for: ${query}`
          }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Search failed');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    try {
      // Find JSON array in the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        return JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Error parsing search results:', parseError);
      throw new Error('Failed to parse search results');
    }
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};
