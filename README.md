# Inkverta - Comic and Novel Translator 

A full-stack application that instantly translates comics, novels and manga using AI-powered OCR and translation services. Features a web application, Chrome extension, and production-ready deployment configuration.

Production guide: see `deployment/PRODUCTION.md`.

## 🌟 Features

### Web Application
- **Drag & Drop Upload**: Upload comic images with ease
- **Advanced OCR**: Multi-language text extraction using Tesseract.js
- **Real-time Translation**: Support for Google Translate and DeepL APIs
- **Novel/Text Mode**: Paste and translate text (no OCR required)
- **Image Editor**: Interactive canvas for text selection and editing
- **Batch Processing**: Handle multiple images simultaneously
- **Download Results**: Export translated comics in various formats

### Chrome Extension
- **Universal Compatibility**: Works on MangaDex, Webtoons, Crunchyroll, and more
- **Right-click Translation**: Instantly translate images from context menu
- **Overlay Display**: Non-intrusive translation overlays
- **Auto-translate**: Optional automatic translation on image click
- **Translation History**: Keep track of previous translations
- **Customizable Settings**: Configure languages, services, and behavior

### Production Features
- **Docker Deployment**: Complete containerization with Docker Compose
- **SSL/HTTPS Support**: Automated certificate management
- **Health Monitoring**: Prometheus, Grafana, and Alertmanager integration
- **Load Balancing**: Nginx reverse proxy with rate limiting
- **Automated Backups**: Scheduled backups for data persistence
- **Performance Optimization**: Redis caching and image optimization

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm 8+
- Docker and Docker Compose (for containerized deployment)
- Google Translate API key (required)
- DeepL API key (optional, for better translations)

### 1. Clone and Setup
```bash
git clone https://github.com/your-username/comic-translator.git
cd comic-translator
npm run setup
```

### 2. Configure Environment
```bash
# Edit backend/.env and add your API keys
cp backend/.env.example backend/.env
# Add your GOOGLE_TRANSLATE_API_KEY and DEEPL_API_KEY
```

### 3. Development Mode
```bash
# Start both backend and frontend
npm run dev

# Or start individually
npm run dev:backend  # Starts on http://localhost:3001
npm run dev:frontend # Starts on http://localhost:3000
```

### 4. Production Deployment
```bash
# Using Docker Compose (recommended)
npm run docker:prod

# Or manual deployment
npm run build
npm run start
```

## 📁 Project Structure

```
comic-translator/
├── backend/                    # Node.js/Express API
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/         # Express middleware
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   └── utils/             # Utility functions
│   ├── uploads/               # File storage
│   └── server.js              # Entry point
├── frontend/                  # React application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API clients
│   │   └── utils/            # Utility functions
│   └── vite.config.js        # Vite configuration
├── chrome-extension/          # Browser extension
│   ├── manifest.json         # Extension manifest
│   ├── popup/               # Extension popup
│   ├── content/             # Content scripts
│   └── background/          # Background scripts
├── docker/                   # Docker configurations
├── deployment/              # Production configs
├── monitoring/              # Monitoring setup
└── scripts/                 # Utility scripts
```

## 🛠️ API Documentation

OpenAPI spec is served at `GET /api/openapi.yaml` (and is also available at `backend/openapi.yaml`).

### Upload Endpoints
- `POST /api/upload/single` - Upload single image
- `POST /api/upload/multiple` - Upload multiple images

### OCR Endpoints
- `POST /api/ocr/extract` - Extract text from image
- `POST /api/ocr/batch` - Batch text extraction

### Translation Endpoints
- `POST /api/translate` - Translate text
- `POST /api/translate/batch` - Batch translation
- `GET /api/translate/languages` - Get supported languages

### URL Import Endpoints
- `POST /api/url/ingest` - Ingest a page URL (extract images + text blocks)

### Health Endpoints
- `GET /api/health` - Application health status
- `GET /api/health/ready` - Readiness probe

## 🔧 Configuration

### Environment Variables
```bash
# Server Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=http://localhost:3000

# Translation APIs
GOOGLE_TRANSLATE_API_KEY=your_key_here
DEEPL_API_KEY=your_key_here

# OCR Configuration
OCR_LANGUAGE=eng+jpn+kor+chi_sim+chi_tra
OCR_PSM=6
OCR_OEM=3

# Cache and Performance
CACHE_TTL=3600
RATE_LIMIT_MAX=100
```

### Chrome Extension Setup
1. Open Chrome → Extensions → Developer mode
2. Click "Load unpacked"
3. Select the `chrome-extension` folder
4. Configure settings in the extension popup

## 🚀 Deployment Options

### 1. Docker (Recommended)
```bash
# Production deployment
docker-compose -f deployment/docker-compose.prod.yml up -d

# Development
docker-compose -f docker/docker-compose.dev.yml up

# With monitoring
npm run monitoring:up
```

### 2. Railway
```bash
# Deploy backend to Railway
railway up --service backend

# Configure environment variables in Railway dashboard
```

### 3. Heroku
```bash
# Deploy using Heroku CLI
heroku create comic-translator-app
git push heroku main
```

### 4. Manual VPS
```bash
# Run setup script
./scripts/setup.sh

# Deploy with SSL
./scripts/deploy.sh production
```

## 📊 Monitoring

The application includes comprehensive monitoring:

- **Prometheus**: Metrics collection and alerting
- **Grafana**: Beautiful dashboards and visualizations
- **Alertmanager**: Smart alert routing and management
- **Loki**: Centralized logging
- **Node Exporter**: System metrics

Access monitoring:
- Grafana: http://localhost:3002 (admin/admin)
- Prometheus: http://localhost:9090
- Alertmanager: http://localhost:9093

## 🔒 Security Features

- Rate limiting on all endpoints
- CORS protection
- Helmet.js security headers
- File type validation
- Size limits on uploads
- SSL/TLS encryption
- Input sanitization

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend

# Linting
npm run lint

# Code formatting
npm run format
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run tests: `npm run test`
5. Commit: `git commit -m 'Add feature'`
6. Push: `git push origin feature-name`
7. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: InkvertaSupport@yourcomictranslator.com
- 🐛 Issues: [GitHub Issues](https://github.com/Opikadash/Inkverta/issues)
- 📖 Documentation: [Wiki](https://github.com/Opikadash/Inkverta/wiki)
- 💬 Discord: [Join our community](https://discord.gg/comic-translator)

## 🙏 Acknowledgments

- [Tesseract.js](https://tesseract.projectnaptha.com/) for OCR capabilities
- [Google Translate API](https://cloud.google.com/translate) for translation services
- [DeepL API](https://www.deepl.com/api) for high-quality translations
- [React](https://reactjs.org/) and [Express](https://expressjs.com/) communities

---

⭐ If you find this project helpful, please give it a star on GitHub!
