# Deployment Guide - Attendance Management System

## 📋 Pre-Deployment Checklist

### 1. Environment Variables
Create production `.env` files:

**Backend (.env)**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
FRONTEND_URL=https://your-frontend-domain.com
```

**Frontend (.env)**
```env
REACT_APP_API_URL=https://your-backend-domain.com/api
```

### 2. Update CORS Settings
In `backend/server.js`, update CORS to allow your production domain:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

### 3. Build Frontend
```bash
cd frontend
npm run build
```

---

## 🚀 Deployment Options

## Option 1: Render (Recommended - Free Tier Available)

### Backend Deployment on Render

1. **Create Account**: Go to [render.com](https://render.com) and sign up

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `ams-backend`
     - **Environment**: `Node`
     - **Build Command**: `cd backend && npm install`
     - **Start Command**: `cd backend && node server.js`
     - **Instance Type**: Free

3. **Add Environment Variables**:
   - Go to "Environment" tab
   - Add all variables from backend `.env`
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Generate a secure random string
   - `FRONTEND_URL`: Will add after frontend deployment
   - `PORT`: 5000

4. **Deploy**: Click "Create Web Service"

### Frontend Deployment on Render

1. **Create New Static Site**:
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `ams-frontend`
     - **Build Command**: `cd frontend && npm install && npm run build`
     - **Publish Directory**: `frontend/build`

2. **Add Environment Variables**:
   - `REACT_APP_API_URL`: Your backend URL from step 1 (e.g., `https://ams-backend.onrender.com/api`)

3. **Deploy**: Click "Create Static Site"

4. **Update Backend CORS**:
   - Go back to backend service
   - Update `FRONTEND_URL` environment variable with your frontend URL

---

## Option 2: Vercel (Frontend) + Render (Backend)

### Backend on Render
Follow the same steps as Option 1 for backend.

### Frontend on Vercel

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Deploy**:
```bash
cd frontend
vercel
```

3. **Configure**:
   - Follow prompts
   - Add environment variable: `REACT_APP_API_URL`
   - Deploy to production: `vercel --prod`

---

## Option 3: Railway (Full Stack)

1. **Create Account**: Go to [railway.app](https://railway.app)

2. **Deploy Backend**:
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Add service: Backend
   - Configure:
     - **Root Directory**: `backend`
     - **Start Command**: `node server.js`
   - Add environment variables

3. **Deploy Frontend**:
   - Add another service: Frontend
   - Configure:
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Start Command**: `npx serve -s build -p $PORT`
   - Add environment variables

4. **Add MongoDB**:
   - Click "New" → "Database" → "Add MongoDB"
   - Copy connection string to backend environment variables

---

## Option 4: Heroku (Paid)

### Backend Deployment

1. **Install Heroku CLI**:
```bash
npm install -g heroku
```

2. **Login and Create App**:
```bash
heroku login
heroku create ams-backend
```

3. **Add MongoDB**:
```bash
heroku addons:create mongolab:sandbox
```

4. **Set Environment Variables**:
```bash
heroku config:set JWT_SECRET=your_secret_key
heroku config:set FRONTEND_URL=https://your-frontend.herokuapp.com
```

5. **Create Procfile** in backend folder:
```
web: node server.js
```

6. **Deploy**:
```bash
git subtree push --prefix backend heroku main
```

### Frontend Deployment

1. **Create Frontend App**:
```bash
heroku create ams-frontend
```

2. **Add Buildpack**:
```bash
heroku buildpacks:set mars/create-react-app
```

3. **Set Environment Variables**:
```bash
heroku config:set REACT_APP_API_URL=https://ams-backend.herokuapp.com/api
```

4. **Deploy**:
```bash
git subtree push --prefix frontend heroku main
```

---

## Option 5: DigitalOcean / AWS / VPS (Advanced)

### Requirements
- Ubuntu 20.04+ server
- Domain name
- SSH access

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2
```

### 2. Deploy Backend

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/yourusername/your-repo.git
cd your-repo/backend

# Install dependencies
sudo npm install

# Create .env file
sudo nano .env
# Add your environment variables

# Start with PM2
sudo pm2 start server.js --name ams-backend
sudo pm2 startup
sudo pm2 save
```

### 3. Deploy Frontend

```bash
cd /var/www/your-repo/frontend

# Install dependencies and build
sudo npm install
sudo npm run build

# Copy build to nginx
sudo cp -r build /var/www/ams-frontend
```

### 4. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/ams
```

Add configuration:
```nginx
# Backend
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/ams-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/ams /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

---

## 🗄️ Database Options

### Option 1: MongoDB Atlas (Recommended - Free Tier)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Create database user
4. Whitelist IP addresses (0.0.0.0/0 for all IPs)
5. Get connection string
6. Add to backend environment variables

### Option 2: Self-Hosted MongoDB
- Use the VPS setup above
- Or use MongoDB Cloud Manager

---

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT_SECRET (min 32 characters)
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Enable MongoDB authentication
- [ ] Whitelist only necessary IPs
- [ ] Set up rate limiting
- [ ] Enable CORS only for your domain
- [ ] Remove console.logs from production
- [ ] Set NODE_ENV=production
- [ ] Regular backups of database
- [ ] Monitor error logs

---

## 📊 Post-Deployment

### 1. Test Everything
- [ ] Login functionality
- [ ] All user roles (Admin, Faculty, Student)
- [ ] Attendance marking
- [ ] Real-time updates
- [ ] Reports generation
- [ ] Excel export
- [ ] Password change
- [ ] Mobile responsiveness

### 2. Set Up Monitoring
- Use PM2 monitoring for Node.js
- Set up error tracking (Sentry)
- Monitor database performance
- Set up uptime monitoring (UptimeRobot)

### 3. Backup Strategy
```bash
# MongoDB backup script
mongodump --uri="your_mongodb_uri" --out=/backups/$(date +%Y%m%d)

# Automate with cron
crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh
```

---

## 🆘 Troubleshooting

### Backend not connecting to MongoDB
- Check MongoDB URI format
- Verify IP whitelist in MongoDB Atlas
- Check firewall rules

### Frontend can't reach backend
- Verify REACT_APP_API_URL is correct
- Check CORS settings
- Verify backend is running

### Real-time features not working
- Check Socket.io configuration
- Verify WebSocket support on hosting platform
- Check firewall for WebSocket ports

### Build fails
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify all dependencies are in package.json

---

## 💰 Cost Estimates

### Free Tier (Recommended for Testing)
- **Render**: Free (with limitations)
- **MongoDB Atlas**: Free (512MB)
- **Total**: $0/month

### Production Ready
- **Render Pro**: $7/month (backend)
- **Vercel Pro**: $20/month (frontend)
- **MongoDB Atlas**: $9/month (2GB)
- **Total**: ~$36/month

### Self-Hosted VPS
- **DigitalOcean Droplet**: $6-12/month
- **Domain**: $10-15/year
- **Total**: ~$10/month

---

## 📝 Quick Start (Render - Easiest)

1. **Create MongoDB Atlas account** → Get connection string
2. **Push code to GitHub**
3. **Create Render account**
4. **Deploy backend**:
   - New Web Service → Connect GitHub
   - Add environment variables
   - Deploy
5. **Deploy frontend**:
   - New Static Site → Connect GitHub
   - Add REACT_APP_API_URL
   - Deploy
6. **Update backend CORS** with frontend URL
7. **Test the application**

**Your app is now live! 🎉**

---

## 📞 Support

If you encounter issues:
1. Check logs in your hosting platform
2. Verify all environment variables
3. Test locally first
4. Check database connection
5. Review CORS settings

---

**Last Updated**: Current Session
**Recommended**: Render (Backend) + Render (Frontend) + MongoDB Atlas
