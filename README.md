# AI Quiz Generator

An intelligent web application that automatically generates quiz questions from uploaded documents using AI. Upload PDF or Word documents, and the app will extract the content and create customizable quizzes with multiple difficulty levels.

## Features

- 📄 **Document Upload**: Support for PDF and Word documents (.pdf, .docx)
- 🤖 **Multiple AI Providers**: Choose from OpenAI, Anthropic (Claude), Google Gemini, DeepSeek, or Grok
- 🎯 **Customizable Quizzes**: Set number of questions, difficulty level, and additional instructions
- 👀 **Text Preview**: Review extracted text before generating questions
- 📊 **Interactive Quiz Display**: Take quizzes directly in the browser
- 📥 **Export Options**: Export quizzes as PDF or Excel files
- 🎨 **Modern UI**: Clean, responsive interface built with React and TailwindCSS

## Project Structure

```
quiz-generator/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── context/           # React context for state management
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API service functions
│   └── utils/             # Utility functions
├── server/                 # Backend NestJS API
│   ├── src/
│   │   ├── ai/             # AI provider integrations
│   │   ├── quiz/          # Quiz generation logic
│   │   ├── upload/        # File upload handling
│   │   ├── parsers/       # Document parsing
│   │   └── formatters/    # Response formatting
│   └── uploads/           # Uploaded files storage
├── Dockerfile             # Docker configuration for full stack
└── Dockerfile.frontend    # Docker configuration for frontend only
```

## Prerequisites

### For Non-Technical Users

- **Docker Desktop** installed on your computer ([Download Docker](https://www.docker.com/products/docker-desktop/))
- An API key from at least one AI provider:
  - [OpenAI](https://platform.openai.com/api-keys) (ChatGPT)
  - [Anthropic](https://console.anthropic.com/) (Claude)
  - [Google Gemini](https://makersuite.google.com/app/apikey)
  - [DeepSeek](https://platform.deepseek.com/)
  - [Grok](https://x.ai/) (X.AI)

### For Developers

- **Node.js** 18+ and npm/yarn
- **TypeScript** knowledge (for backend development)
- **React** knowledge (for frontend development)

## Quick Start (Docker - Recommended for Non-Technical Users)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd quiz-generator
```

### Step 2: Create Environment File

Create a file named `.env` in the `server` directory:

```bash
cd server
touch .env
```

Add your API keys to the `.env` file (at least one is required):

```env
# Server Configuration
PORT=3001
UPLOADS_DIR=uploads

# AI Provider API Keys (add at least one)
OPENAI_API_KEY=your-openai-api-key-here
# OPENAI_BASE_URL=https://api.openai.com/v1  # Optional, for custom endpoints

ANTHROPIC_API_KEY=your-anthropic-api-key-here

GEMINI_API_KEY=your-gemini-api-key-here

DEEPSEEK_API_KEY=your-deepseek-api-key-here

GROK_API_KEY=your-grok-api-key-here
# GROK_BASE_URL=https://api.grok.ai/v1  # Optional
```

**Note**: You only need to add API keys for the providers you want to use. The app will work with just one provider configured.

### Step 3: Build and Run with Docker

From the project root directory:

```bash
docker build -t quiz-generator .
docker run -p 3000:3000 --env-file server/.env quiz-generator
```

The application will be available at `http://localhost:3000`

## Development Setup (For Developers)

### Step 1: Install Dependencies

**Frontend:**
```bash
npm install
# or
yarn install
```

**Backend:**
```bash
cd server
npm install
# or
yarn install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the `server` directory (see Quick Start section above for the format).

### Step 3: Run the Application

You'll need to run both the frontend and backend separately:

**Terminal 1 - Backend:**
```bash
cd server
npm run start:dev
# or
yarn start:dev
```

The backend API will run on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
npm run dev
# or
yarn dev
```

The frontend will run on `http://localhost:5173` (or another port if 5173 is busy)

### Step 4: Access the Application

Open your browser and navigate to `http://localhost:5173`

## Available Scripts

### Frontend Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend Scripts

- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start:prod` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

## How to Use

1. **Upload Document**: Click "Upload" and select a PDF or Word document
2. **Preview Text**: Review the extracted text to ensure it's correct
3. **Generate Quiz**: 
   - Choose number of questions
   - Select difficulty level (Easy, Medium, Hard)
   - Pick an AI provider
   - Optionally add custom instructions
   - Click "Generate Quiz"
4. **Take Quiz**: Answer the questions in the interactive quiz interface
5. **Export**: Download your quiz as PDF or Excel file

## API Documentation

When the backend is running, API documentation is available at:
- Swagger UI: `http://localhost:3001/api`

## Troubleshooting

### Common Issues

**"API key not found" warnings:**
- Make sure you've created a `.env` file in the `server` directory
- Verify your API keys are correctly formatted (no extra spaces or quotes)
- Restart the server after adding/changing environment variables

**File upload fails:**
- Check that the file is a supported format (.pdf, .docx)
- Ensure the file size is reasonable (large files may take longer to process)
- Check server logs for detailed error messages

**Frontend can't connect to backend:**
- Verify the backend is running on port 3001
- Check that CORS is enabled (it should be by default)
- Ensure no firewall is blocking the connection

**Docker build fails:**
- Make sure Docker Desktop is running
- Check that you have enough disk space
- Try cleaning Docker cache: `docker system prune -a`

## Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **Material UI** - UI components
- **Axios** - HTTP client

### Backend
- **NestJS** - Node.js framework
- **TypeScript** - Type safety
- **Multer** - File upload handling
- **PDF-Parse** - PDF text extraction
- **Mammoth** - Word document parsing
- **Swagger** - API documentation

### AI Providers
- OpenAI (GPT models)
- Anthropic (Claude)
- Google Gemini
- DeepSeek
- Grok (X.AI)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is unlicensed. See the LICENSE file for details.

## Support

For issues, questions, or contributions, please open an issue on the repository.

---

**Happy Quiz Generating! 🎓**
