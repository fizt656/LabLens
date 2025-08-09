![LabLens Logo](lablens.png)

# LabLens - Clinical Lab Results Communication Tool

LabLens is a cross-platform desktop application designed to help clinicians quickly generate patient and staff messages from lab results. The application uses AI to analyze lab result images/PDFs and generates appropriate communication messages for different audiences.

## Features

- **File Upload Support**: Accepts PNG, JPG, and PDF files containing lab results
- **AI-Powered Analysis**: Extracts and interprets lab values from uploaded files
- **Dual Message Generation**:
  - **Patient Messages**: Written at 6-8th grade reading level, concise and reassuring
  - **Staff Messages**: Clinical format with bullet points, terse and technical
- **Easy Copy-Paste**: One-click copying for seamless workflow integration
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
3. The application will automatically use OpenAI's GPT-4 Vision model

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
> Your recent cholesterol test shows some levels that are higher than we would like to see. Your total cholesterol is elevated at 262 mg/dL. We recommend keeping this below 200 mg/dL. Your LDL (bad) cholesterol is high at 166 mg/dL. This is the type of cholesterol that can build up in your arteries. The good news is your HDL (good) cholesterol is at a healthy level of 70 mg/dL.

### Staff Message Sample:
> **Lipid Panel Results:**
> • Total Cholesterol: 262 mg/dL (HIGH) [Ref: <200]
> • LDL Cholesterol: 166 mg/dL (HIGH) [Ref: <130]
> • HDL Cholesterol: 70 mg/dL [Ref: >40]
> • Triglycerides: 111 mg/dL [Ref: <150]
> 
> **Recommendations:**
> • Lifestyle modifications: diet, exercise, weight management
> • Recheck lipid panel in 6-8 weeks
> • Consider statin therapy if lifestyle changes insufficient

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
