const axios = require('axios');

class LLMAnalyzer {
    constructor() {
        // Configuration for different LLM providers
        this.config = {
            provider: 'openai', // 'openai', 'openrouter', or 'local'
            openaiApiKey: process.env.OPENAI_API_KEY || '',
            openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
            model: 'gpt-4o' // Default OpenAI model
        };
        
        // Popular OpenRouter models with vision capabilities
        this.openrouterModels = [
            { id: 'openai/gpt-4o', name: '4o' },
            { id: 'openai/gpt-4o-mini', name: '4o-mini' },
            { id: 'meta-llama/llama-4-maverick', name: 'maverick' },
            { id: 'google/gemini-2.5-flash', name: '2.5-flash' }
        ];
    }

    async analyzeLabResults(imageData, fileType) {
        try {
            if (this.config.provider === 'openai') {
                return await this.analyzeWithOpenAI(imageData, fileType);
            } else if (this.config.provider === 'openrouter') {
                return await this.analyzeWithOpenRouter(imageData, fileType);
            } else if (this.config.provider === 'anthropic') {
                return await this.analyzeWithAnthropic(imageData, fileType);
            } else {
                // Fallback to mock data for development
                return this.getMockAnalysis();
            }
        } catch (error) {
            console.error('LLM Analysis Error:', error);
            // Return mock data as fallback
            return this.getMockAnalysis();
        }
    }

    async analyzeWithOpenAI(imageData, fileType) {
        if (!this.config.openaiApiKey) {
            console.warn('No OpenAI API key provided, using mock data');
            return this.getMockAnalysis();
        }

        const prompt = this.getAnalysisPrompt();
        
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: prompt
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/${fileType.replace('.', '')};base64,${imageData}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1000
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.config.openaiApiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const result = response.data.choices[0].message.content;
        return this.parseAnalysisResult(result);
    }

    async analyzeWithOpenRouter(imageData, fileType) {
        if (!this.config.openrouterApiKey) {
            console.warn('No OpenRouter API key provided, using mock data');
            return this.getMockAnalysis();
        }

        const prompt = this.getAnalysisPrompt();
        
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: this.config.model,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: prompt
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/${fileType.replace('.', '')};base64,${imageData}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1000
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.config.openrouterApiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://github.com/fizt656/LabLens',
                    'X-Title': 'LabLens'
                }
            }
        );

        const result = response.data.choices[0].message.content;
        return this.parseAnalysisResult(result);
    }

    async analyzeWithAnthropic(imageData, fileType) {
        // Placeholder for Anthropic Claude integration
        // Would require similar implementation with Claude's API
        console.warn('Anthropic integration not implemented, using mock data');
        return this.getMockAnalysis();
    }

    getAnalysisPrompt() {
        return `
Analyze this lab results image and extract ALL available data from ALL time periods/columns. Return in this JSON format:

{
  "labType": "Type of lab panel (e.g., Lipid Panel, Basic Metabolic Panel, etc.)",
  "timePeriods": [
    {
      "label": "time_period_label (e.g., '2 wk ago', '3 mo ago', 'Current', etc.)",
      "results": {
        "testName": {
          "value": numeric_value,
          "unit": "unit_of_measurement",
          "status": "normal|high|low|borderline",
          "reference": "reference_range"
        }
      }
    }
  ]
}

IMPORTANT: 
- Look for ALL columns of data with different time periods
- Extract data from EVERY column you can see (e.g., "2 wk ago", "3 mo ago", etc.)
- If there's only one column, still use the timePeriods array with one entry
- Use the exact time period labels from the image
- For each lab value, determine if it's normal, high, low, or borderline based on standard reference ranges

Common lab panels to look for:
- Lipid Panel: Total Cholesterol, LDL, HDL, Triglycerides
- Basic Metabolic Panel: Glucose, Sodium, Potassium, Chloride, CO2, BUN, Creatinine
- Liver Function: ALT, AST, Bilirubin, Alkaline Phosphatase
- Thyroid: TSH, T3, T4
- Complete Blood Count: WBC, RBC, Hemoglobin, Hematocrit, Platelets

Use camelCase for test names in the JSON (e.g., totalCholesterol, ldlCholesterol).
Only return the JSON object, no additional text.
        `;
    }

    parseAnalysisResult(result) {
        try {
            // Try to extract JSON from the response
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    success: true,
                    analysis: parsed
                };
            }
        } catch (error) {
            console.error('Failed to parse LLM response:', error);
        }

        // Fallback to mock data if parsing fails
        return this.getMockAnalysis();
    }

    getMockAnalysis() {
        // Mock data with multiple time periods to test if real API is working
        return {
            success: true,
            analysis: {
                labType: 'Lipid Panel (MOCK DATA)',
                timePeriods: [
                    {
                        label: '2 wk ago',
                        results: {
                            totalCholesterol: { 
                                value: 180, 
                                unit: 'mg/dL', 
                                status: 'normal', 
                                reference: '<200' 
                            },
                            ldlCholesterol: { 
                                value: 95, 
                                unit: 'mg/dL', 
                                status: 'normal', 
                                reference: '<130' 
                            },
                            hdlCholesterol: { 
                                value: 55, 
                                unit: 'mg/dL', 
                                status: 'normal', 
                                reference: '>40' 
                            },
                            triglycerides: { 
                                value: 85, 
                                unit: 'mg/dL', 
                                status: 'normal', 
                                reference: '<150' 
                            }
                        }
                    },
                    {
                        label: '3 mo ago',
                        results: {
                            totalCholesterol: { 
                                value: 190, 
                                unit: 'mg/dL', 
                                status: 'normal', 
                                reference: '<200' 
                            },
                            ldlCholesterol: { 
                                value: 105, 
                                unit: 'mg/dL', 
                                status: 'normal', 
                                reference: '<130' 
                            },
                            hdlCholesterol: { 
                                value: 50, 
                                unit: 'mg/dL', 
                                status: 'normal', 
                                reference: '>40' 
                            },
                            triglycerides: { 
                                value: 95, 
                                unit: 'mg/dL', 
                                status: 'normal', 
                                reference: '<150' 
                            }
                        }
                    }
                ]
            }
        };
    }

    async generatePatientMessage(labData) {
        const prompt = this.getPatientMessagePrompt(labData);
        
        try {
            if (this.config.provider === 'openai') {
                return await this.generateMessageWithOpenAI(prompt);
            } else if (this.config.provider === 'openrouter') {
                return await this.generateMessageWithOpenRouter(prompt);
            } else {
                return this.getFallbackPatientMessage(labData);
            }
        } catch (error) {
            console.error('Error generating patient message:', error);
            return this.getFallbackPatientMessage(labData);
        }
    }

    async generateStaffMessage(labData) {
        const prompt = this.getStaffMessagePrompt(labData);
        
        try {
            if (this.config.provider === 'openai') {
                return await this.generateMessageWithOpenAI(prompt);
            } else if (this.config.provider === 'openrouter') {
                return await this.generateMessageWithOpenRouter(prompt);
            } else {
                return this.getFallbackStaffMessage(labData);
            }
        } catch (error) {
            console.error('Error generating staff message:', error);
            return this.getFallbackStaffMessage(labData);
        }
    }

    async generateMessageWithOpenAI(prompt) {
        if (!this.config.openaiApiKey) {
            throw new Error('No OpenAI API key available');
        }

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 800,
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.config.openaiApiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].message.content;
    }

    async generateMessageWithOpenRouter(prompt) {
        if (!this.config.openrouterApiKey) {
            throw new Error('No OpenRouter API key available');
        }

        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: this.config.model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 800,
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.config.openrouterApiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://github.com/fizt656/LabLens',
                    'X-Title': 'LabLens'
                }
            }
        );

        return response.data.choices[0].message.content;
    }

    getPatientMessagePrompt(labData) {
        return `You are a healthcare provider explaining lab results to a patient.

GUIDELINES:
- Keep response to 3-4 paragraphs
- Use 6th-8th grade reading level
- Be warm, caring, and reassuring
- Get straight to the point - no greetings like "Hi there"
- Focus on most significant findings
- Include trend information if available
- Provide specific, actionable lifestyle recommendations
- Include follow-up timeline
- End with warm reassurance to contact office with questions
- Do NOT end with questions

LAB DATA:
${JSON.stringify(labData, null, 2)}

Generate a caring, comprehensive message that covers:
1. Direct overall assessment of results
2. Key findings in simple terms with trends (if multiple time periods)
3. Specific lifestyle recommendations based on the results:
   - Diet suggestions (foods to eat more/less of)
   - Exercise recommendations
   - Other lifestyle changes if relevant
4. Follow-up plan and timeline
5. End with reassuring reminder to contact office with any questions

Tailor recommendations to the specific lab values. For example:
- High cholesterol: Mediterranean diet, omega-3 foods, reduce saturated fats
- High blood sugar: limit refined carbs, increase fiber
- Normal results: continue current healthy habits

Start directly with the results. End with something like "Please contact our office if you have any questions." Return only the message content, no additional formatting.`;
    }

    getStaffMessagePrompt(labData) {
        return `You are generating a clinical communication for healthcare staff.

GUIDELINES:
- Use bullet point format with comprehensive clinical details
- Be technical and precise with medical terminology
- Include all relevant clinical information healthcare staff need
- Use clinical abbreviations appropriately
- Structure: 
    - Results 
    - Trends
    - Assessment
    - Plan
    - Follow-up
- Include risk stratification and clinical significance
- make sure output is formatted nicely and easy to read, succinct.

LAB DATA:
${JSON.stringify(labData, null, 2)}

Generate a comprehensive clinical message with this structure:

• **Results:** [Complete values with reference ranges and status indicators]
• **Trends:** [Detailed changes with percentages and clinical significance if multiple periods]
• **Risk Assessment:** [Cardiovascular risk, metabolic risk, clinical significance]
• **Clinical Significance:** [Pathophysiology, guideline references, risk stratification]
• **Therapeutic Plan:** [Specific interventions - lifestyle, medications, monitoring]
• **Follow-up:** [Timeline, specific tests, monitoring parameters]
• **Patient Education:** [Key points discussed/to discuss with patient]
• **Documentation:** [ICD codes, billing considerations if relevant]

Include details like:
- Framingham risk factors if applicable
- Guideline references (AHA/ACC, ADA, etc.)
- Medication considerations and contraindications
- Lifestyle modification specifics
- Monitoring frequency and parameters
- Red flags or concerning trends

Use HTML formatting. Be thorough and clinically comprehensive. Return only the message content.`;
    }

    getFallbackPatientMessage(labData) {
        return "Your lab results have been analyzed. Please discuss these results with your healthcare provider for a detailed explanation and recommendations.";
    }

    getFallbackStaffMessage(labData) {
        return "<p><strong>Lab Results:</strong> Analysis complete. Please review structured data for clinical interpretation.</p>";
    }

    // Method to get available models for UI
    getAvailableModels() {
        return this.openrouterModels;
    }

    // Method to update configuration
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}

module.exports = LLMAnalyzer;
