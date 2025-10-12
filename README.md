# FollowUpMate - Automated Follow-up Email SaaS

A modern micro-SaaS application that helps freelancers and small business owners automate their follow-up email campaigns.

## 🚀 Features

- **Automated Follow-ups**: Schedule and send follow-up emails automatically
- **Template Management**: Create and customize email templates with variables
- **Client Tracking**: Track which clients have replied to your follow-ups
- **Smart Scheduling**: Flexible follow-up delays and sequences
- **Modern UI**: Clean, responsive interface with light blue and slate grey theme
- **User Authentication**: Secure JWT-based authentication
- **Subscription Plans**: Free and Pro tiers with Stripe integration ready

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- React Hook Form for form handling
- Axios for API calls
- Lucide React for icons

### Backend
- Node.js with Express
- TypeScript
- SQLite database
- JWT authentication
- Nodemailer for email sending
- Node-cron for scheduling
- Stripe for payments (ready)

## 📦 Installation

1. **Install dependencies**
   ```bash
   npm run install:all
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the development servers**
   ```bash
   npm run dev
   ```

This will start:
- Backend server on http://localhost:3001
- Frontend development server on http://localhost:3000

## ⚙️ Configuration

### Email Setup (Gmail)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: Google Account → Security → App passwords
3. Add the App Password to your `.env` file

### Database
The app uses SQLite by default. The database file will be created automatically in `src/data/followupmate.db`.

### Stripe Integration
1. Create a Stripe account
2. Get your API keys from the Stripe dashboard
3. Add them to your `.env` file

## 📱 Usage

1. **Sign Up**: Create a new account
2. **Create Templates**: Set up your email templates with variables
3. **Add Follow-ups**: Create follow-up campaigns for your clients
4. **Monitor**: Track the status of your follow-ups in the dashboard

## �� Customization

The app uses a light blue and slate grey color scheme. You can customize the colors in `client/tailwind.config.js`.

## 🚀 Deployment

### Backend
1. Build the server: `npm run build:server`
2. Start the server: `npm start`

### Frontend
1. Build the client: `npm run build:client`
2. Serve the built files with a web server

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support, email support@followupmate.com or create an issue in the repository.