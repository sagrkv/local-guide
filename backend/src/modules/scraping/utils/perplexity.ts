import { config } from '../../../config.js';

interface PerplexityResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface BusinessResult {
  name: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  hasWebsite: boolean;
  needsRedesign?: boolean;
}

export const perplexityClient = {
  async query(prompt: string): Promise<string> {
    if (!config.perplexityApiKey) {
      throw new Error('Perplexity API key not configured');
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.perplexityApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that finds and analyzes business information. Always respond with structured, accurate data.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data: PerplexityResponse = await response.json();
    return data.choices[0]?.message?.content || '';
  },

  async searchBusinesses(query: string, location?: string): Promise<BusinessResult[]> {
    const prompt = `Find ${query}${location ? ` in ${location}` : ''}.

For each business found, provide:
1. Business name
2. Whether they have a website (yes/no)
3. Website URL if available
4. Phone number if available
5. Email if available
6. Address/City

Format your response as a JSON array with objects containing: name, hasWebsite, website, phone, email, address, city.
Only include businesses you are confident about. Return maximum 10 businesses.
Response must be valid JSON array only, no other text.`;

    try {
      const response = await this.query(prompt);

      // Try to parse JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('Failed to parse Perplexity response as JSON');
        return [];
      }

      const businesses = JSON.parse(jsonMatch[0]);
      return businesses.map((b: any) => ({
        name: b.name || '',
        description: b.description,
        website: b.website,
        phone: b.phone,
        email: b.email,
        address: b.address,
        city: b.city || location,
        hasWebsite: b.hasWebsite === true || b.hasWebsite === 'yes' || !!b.website,
      }));
    } catch (error) {
      console.error('Error searching businesses with Perplexity:', error);
      return [];
    }
  },

  async analyzeWebsite(url: string): Promise<{
    isOutdated: boolean;
    isMobileResponsive: boolean;
    needsRedesign: boolean;
    summary: string;
  }> {
    const prompt = `Analyze the website at ${url}. Determine:
1. Is the website design outdated (older than 3-4 years)?
2. Does it appear to be mobile responsive?
3. Does it need a redesign?
4. Brief summary of the website quality.

Respond in JSON format with keys: isOutdated (boolean), isMobileResponsive (boolean), needsRedesign (boolean), summary (string).
Return only valid JSON, no other text.`;

    try {
      const response = await this.query(prompt);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          isOutdated: false,
          isMobileResponsive: true,
          needsRedesign: false,
          summary: 'Unable to analyze',
        };
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error analyzing website with Perplexity:', error);
      return {
        isOutdated: false,
        isMobileResponsive: true,
        needsRedesign: false,
        summary: 'Analysis failed',
      };
    }
  },

  async enrichBusinessInfo(businessName: string, city?: string): Promise<{
    email?: string;
    phone?: string;
    website?: string;
    socialMedia?: string[];
    description?: string;
  }> {
    const location = city ? ` in ${city}` : '';
    const prompt = `Find contact information for "${businessName}"${location}.

Return:
1. Email address
2. Phone number
3. Website URL
4. Social media links (LinkedIn, Twitter, Instagram, Facebook)
5. Brief description of the business

Respond in JSON format with keys: email, phone, website, socialMedia (array), description.
Return only valid JSON, no other text. Use null for missing information.`;

    try {
      const response = await this.query(prompt);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {};
      }

      const data = JSON.parse(jsonMatch[0]);
      return {
        email: data.email || undefined,
        phone: data.phone || undefined,
        website: data.website || undefined,
        socialMedia: Array.isArray(data.socialMedia) ? data.socialMedia.filter(Boolean) : undefined,
        description: data.description || undefined,
      };
    } catch (error) {
      console.error('Error enriching business info with Perplexity:', error);
      return {};
    }
  },
};
