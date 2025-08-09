![LabLens Logo](lablens.png)

# LabLens - Clinical Lab Results Communication Tool

LabLens is a cross-platform desktop application designed to help clinicians quickly generate patient and staff messages from lab results. The application uses AI to analyze lab result images/PDFs and generates appropriate communication messages for different audiences.

## Features

- **File Upload Support**: Accepts PNG, JPG, and PDF files containing lab results
- **AI-Powered Analysis**: Extracts and interprets lab values from uploaded files using vision-capable LLMs
- **Multi-Provider LLM Support**: Choose between OpenAI and OpenRouter for analysis
- **Settings Panel**: Easy configuration of AI providers and models
- **Dual Message Generation**:
  - **Patient Messages**: Warm, comprehensive messages with lifestyle recommendations (6-8th grade reading level)
  - **Staff Messages**: Clinical format with risk assessment, guidelines, and follow-up plans
- **Trend Analysis**: Compares results across multiple time periods when available
- **Easy Copy-Paste**: One-click copying for seamless workflow integration
- **Fallback Support**: Continues working even without API keys using rule-based messages
- **Cross-Platform**: Works on Mac, Windows, and Linux
- **Portable**: No installation required - just download and run

## Installation

### Prerequisites

- Node.js (version 16 or higher)
- npm (comes with Node.js)

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/fizt656/LabLens.git
cd LabLens
```

2. Install dependencies:
```bash
npm install
```

3. Run in development mode:
```bash
npm run dev
```

### Building Executables

To build standalone executables for distribution:

```bash
# Build for all platforms
npm run build

# Build for specific platforms
npm run build-mac    # macOS
npm run build-win    # Windows
npm run build-linux  # Linux
```

Built executables will be available in the `dist/` directory.

## Configuration

### LLM API Setup

The application supports multiple LLM providers for lab result analysis:

#### OpenAI (Recommended)

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Set the environment variable:
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```
3. In the application settings, select "OpenAI" as your provider
4. The application will use OpenAI's GPT-4o Vision model

#### OpenRouter (Alternative)

1. Get an API key from [OpenRouter](https://openrouter.ai/keys)
2. Set the environment variable:
   ```bash
   export OPENROUTER_API_KEY="your-api-key-here"
   ```
3. In the application settings, select "OpenRouter" as your provider
4. Choose from available models like GPT-4o, Claude 3.5 Sonnet, Gemini Pro Vision, or Llama 3.2 90B Vision

#### Settings Panel

- Click the settings icon (⚙️) in the top-right corner to access configuration
- Switch between OpenAI and OpenRouter providers
- Select specific models when using OpenRouter
- Settings are automatically saved and persist between sessions

#### Development Mode

Without an API key, the application will use mock data based on the sample lab results for testing and development.

## Usage

1. **Launch the Application**: Double-click the executable or run `npm start`

2. **Upload Lab Results**: 
   - Drag and drop a file onto the upload area, or
   - Click the upload area to browse for files
   - Supported formats: PNG, JPG, PDF

3. **Review Analysis**: 
   - The application will automatically analyze the uploaded file
   - Lab values will be displayed with their status (normal, high, low, borderline)

4. **Generate Messages**:
   - Click "Generate Patient Message" for patient-friendly communication
   - Click "Generate Staff Message" for clinical documentation
   - Messages appear side-by-side for easy comparison

5. **Copy and Use**:
   - Click the "Copy" button next to each message
   - Paste directly into your clinical system or communication platform

## Supported Lab Panels

The application can analyze various common lab panels including:

- **Lipid Panel**: Total Cholesterol, LDL, HDL, Triglycerides
- **Basic Metabolic Panel**: Glucose, Sodium, Potassium, Chloride, CO2, BUN, Creatinine
- **Liver Function Tests**: ALT, AST, Bilirubin, Alkaline Phosphatase
- **Thyroid Function**: TSH, T3, T4
- **Complete Blood Count**: WBC, RBC, Hemoglobin, Hematocrit, Platelets

## Message Examples

### Patient Message Sample:
> Your cholesterol levels show some areas that need attention. Your total cholesterol is elevated at 262 mg/dL, and your LDL (bad) cholesterol is high at 166 mg/dL. The good news is your HDL (good) cholesterol is at a healthy level of 70 mg/dL.
>
> To help improve these numbers, focus on eating more fruits, vegetables, and whole grains. Try to include fish like salmon twice a week for healthy omega-3 fats. Limit foods high in saturated fat like red meat and full-fat dairy. Regular exercise - even 30 minutes of walking most days - can make a big difference.
>
> We'll recheck your cholesterol in 6-8 weeks to see how you're doing. Please contact our office if you have any questions.

### Staff Message Sample:
> • **Results:** TC 262 mg/dL (high, ref <200), LDL 166 mg/dL (high, ref <130), HDL 70 mg/dL (normal, ref >40), TG 111 mg/dL (normal, ref <150)
> • **Trends:** No prior data available for comparison
> • **Risk Assessment:** Elevated cardiovascular risk due to high LDL-C, mitigated by optimal HDL-C
> • **Clinical Significance:** Per AHA/ACC guidelines, LDL >160 mg/dL indicates high risk, consider statin therapy
> • **Therapeutic Plan:** Lifestyle modifications (Mediterranean diet, 150 min/week exercise), consider atorvastatin 20mg daily
> • **Follow-up:** Recheck lipid panel in 6-8 weeks, assess statin tolerance and efficacy
> • **Patient Education:** Dietary counseling provided, exercise recommendations discussed
> • **Documentation:** Z13.220 (screening for lipid disorders), E78.5 (hyperlipidemia, unspecified)

## File Structure

```
LabLens/
├── src/
│   ├── main.js                 # Electron main process
│   ├── renderer/
│   │   ├── index.html         # Main UI
│   │   ├── styles.css         # Application styles
│   │   └── renderer.js        # Frontend logic
│   └── utils/
│       └── llm-analyzer.js    # LLM integration
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## Development

### Adding New Lab Panel Support

1. Update the `getAnalysisPrompt()` method in `src/utils/llm-analyzer.js`
2. Add new test name mappings in `formatLabName()` in `src/renderer/renderer.js`
3. Update message generation logic for new lab types

### Customizing Message Templates

Message generation logic is in `src/renderer/renderer.js`:
- `generatePatientMessage()` - Patient-friendly messages
- `generateStaffMessage()` - Clinical staff messages

## Security & Privacy

- All file processing happens locally on your machine
- Lab result images are only sent to the configured LLM API for analysis
- No data is stored permanently by the application
- API keys should be kept secure and not shared

## Troubleshooting

### Common Issues

1. **"Error analyzing lab results"**
   - Check your internet connection
   - Verify API key is set correctly
   - Ensure the uploaded file contains clear, readable lab results

2. **Application won't start**
   - Ensure Node.js is installed (version 16+)
   - Run `npm install` to install dependencies
   - Check console for error messages

3. **Copy function not working**
   - Some systems require clipboard permissions
   - Try manually selecting and copying the text

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please use the GitHub Issues page.
