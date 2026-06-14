# Identity Risk Dashboard - Setup & Run Guide

## 📋 Overview
This is a professional Identity Access Control & Risk Management Dashboard that analyzes user risk patterns across hybrid identity environments.

### Features
✅ **Real-time Risk Scoring** - Analyzes 300+ users with ML-based risk assessment  
✅ **Interactive Dashboard** - Beautiful UI with risk distribution charts  
✅ **Risk Categorization** - CRITICAL, HIGH, MEDIUM, LOW risk levels  
✅ **Detailed Findings** - Root cause analysis and recommendations  
✅ **Multi-filter Search** - Search by username, email, department  
✅ **REST API** - Complete API for programmatic access  

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- npm or yarn

### Step 1: Install Backend Dependencies
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Install Frontend Dependencies
```bash
cd frontend
npm install
```

### Step 3: Run the Risk Scorer (Generate Data)
```bash
cd backend
source venv/bin/activate
python risk_scorer.py
```
This generates `risk_scored_users.csv` with risk analysis for all users.

### Step 4: Start Backend API Server
```bash
cd backend
source venv/bin/activate
python app.py
```
Backend will run on **http://localhost:5000**

### Step 5: Start Frontend Dev Server (New Terminal)
```bash
cd frontend
npm run dev
```
Frontend will run on **http://localhost:5173**

### Step 6: Open Dashboard
Navigate to **http://localhost:5173** in your browser

---

## 📊 Dashboard Features

### 1. **Key Metrics**
- 🚨 **Critical Risk Users** - Most dangerous accounts
- ⚠️ **High Risk Users** - Elevated risk level
- ⚡ **Medium Risk Users** - Monitor closely
- ✅ **Low Risk Users** - Normal activity

### 2. **Charts & Visualizations**
- **Risk Distribution (Doughnut Chart)** - Overall risk breakdown
- **Risk by Privilege Level (Bar Chart)** - Privilege analysis

### 3. **User Risk Table**
- Sort by all columns
- Color-coded risk levels
- Quick view of key metrics
- Click "Details" for full analysis

### 4. **Advanced Filtering**
- Filter by risk level (All, Critical, High, Medium, Low)
- Search by username, email, or department
- Real-time table updates

### 5. **User Details Modal**
Click any user's "Details" button to see:
- Profile information
- Risk assessment scores
- Access profile & systems
- Risk findings (specific issues)
- Remediation recommendations
- Technical explanation

---

## 🔌 API Endpoints

### Available Routes
```bash
# Health Check
GET /api/health

# Get all risk data
GET /api/risk-data

# Get risk statistics
GET /api/risk-stats

# Get specific user details
GET /api/user/<user_id>

# Get top 20 risky users
GET /api/top-risks

# Get risk by department
GET /api/risk-by-department

# Get risk by privilege level
GET /api/risk-by-privilege

# Get findings summary
GET /api/findings

# Get risk score distribution
GET /api/risk-timeline
```

### Example Requests
```bash
# Get all users
curl http://localhost:5000/api/risk-data

# Get user details
curl http://localhost:5000/api/user/USR00088

# Get statistics
curl http://localhost:5000/api/risk-stats
```

---

## 📈 How Risk Scoring Works

### Risk Factors
1. **Inactivity** (0-40 pts)
   - <7 days: 0 pts
   - 7-30 days: 10 pts
   - 30-60 days: 25 pts
   - 60+ days: 40 pts

2. **Privilege Level** (0-40 pts)
   - User: 10 pts
   - Power-user: 25 pts
   - Admin: 40 pts

3. **Stale Admin Risk** (0-25 pts)
   - Admin inactive >30 days: +25 pts

4. **System Access Breadth** (0-15 pts)
   - 2 pts per system (max 15)

5. **Service Account Risk** (0-15 pts)
   - Contains: svc, service, bot, system, automation: +15 pts

6. **Behavioral Anomalies**
   - High sensitivity access: +8 pts each
   - Failed logins: +6 pts each
   - Night events: +5 pts each
   - Weekend events: +3 pts each
   - Admin operations: +10 pts each

7. **Executive Protection** (-10 pts)
   - CTO, CISO, Chief roles: -10 pts

### Risk Levels
- **CRITICAL** (90-100): Immediate investigation required
- **HIGH** (70-89): Review within 1 week
- **MEDIUM** (40-69): Monitor, schedule review
- **LOW** (0-39): Normal risk profile

---

## 🎯 Use Cases

### Security Team Workflows
1. **Morning Brief** - Check Critical/High risk users
2. **Investigation** - Click user details for findings & recommendations
3. **Response** - Follow recommendations (disable, reset, audit)
4. **Tracking** - Monitor department/privilege trends

### Compliance Officer
- Generate reports on stale accounts
- Track privilege escalation patterns
- Monitor admin account activity
- Validate least-privilege compliance

### IT Operations
- Identify orphaned service accounts
- Audit unusual access patterns
- Track privilege scope creep
- Plan access reviews

---

## 🔧 Configuration

### Customize Risk Scoring
Edit `backend/risk_scorer.py`:
- Adjust scoring weights (PRIVILEGE_SCORES)
- Modify inactivity thresholds
- Add/remove behavioral factors
- Tune risk level boundaries

### Customize Dashboard
Edit `frontend/src/main.ts`:
- Change metric display
- Modify table columns
- Adjust chart colors
- Add new filters

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check Python version
python --version  # Should be 3.9+

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check if port 5000 is in use
lsof -i :5000
```

### Frontend Won't Load Data
- Ensure backend is running on http://localhost:5000
- Check browser console for CORS errors
- Verify API responds: `curl http://localhost:5000/api/health`

### CSV File Not Found
- Ensure you ran `python risk_scorer.py` in backend directory
- Check `backend/risk_scored_users.csv` exists
- Verify CSV file has data

### Port Already in Use
```bash
# Kill process on port 5000 (Backend)
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Kill process on port 5173 (Frontend)
lsof -i :5173 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

---

## 📦 Deployment

### Build Frontend for Production
```bash
cd frontend
npm run build
# Creates 'dist' folder with optimized files
```

### Deploy to Cloud
1. **Backend** - Deploy Flask app to AWS EC2, Heroku, or Azure App Service
2. **Frontend** - Deploy 'dist' folder to AWS S3 + CloudFront, Netlify, or Vercel
3. **Update API URL** - Modify proxy URL in frontend to point to cloud backend

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review API documentation
3. Check console logs (browser F12)
4. Verify CSV data format

---

## 🎓 Learning Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Chart.js Guide](https://www.chartjs.org/docs/latest/)

---

## 📄 License
This project is for educational and enterprise use.

**Happy Securing! 🔐**
