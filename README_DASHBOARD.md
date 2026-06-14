# 🔐 Identity Risk Dashboard

> **Enterprise-Grade Identity Access Control & Risk Management System**
> 
> Detect risky privilege patterns, stale accounts, and suspicious behavior across hybrid identity platforms.

![Risk Dashboard](./assets/dashboard-preview.png)

---

## ⚡ Quick Start (30 seconds)

### macOS / Linux
```bash
chmod +x start.sh
./start.sh
```

### Windows
```cmd
start.bat
```

The dashboard will automatically:
- ✅ Generate risk scores for 300+ users
- ✅ Start backend API (Port 5000)
- ✅ Start frontend dashboard (Port 5173)
- ✅ Open browser at http://localhost:5173

---

## 📊 What You Get

### Dashboard Features
- **🚨 Risk Metrics** - Critical, High, Medium, Low user counts
- **📈 Charts** - Risk distribution and privilege-level analysis
- **🔍 Advanced Search** - Filter by username, email, department
- **👤 User Details** - Deep dive into risk factors and recommendations
- **🔌 REST API** - 10+ endpoints for programmatic access

### Risk Analysis
- **Risk Scoring** - ML-based 0-100 score per user
- **Risk Levels** - CRITICAL, HIGH, MEDIUM, LOW classifications
- **Findings** - Root cause analysis (stale accounts, admin risk, etc.)
- **Recommendations** - Actionable security remediation steps
- **Confidence Scores** - Evidence strength for each finding

---

## 🎯 Sample Use Cases

### Security Team
```
Morning Workflow:
1. Check "Critical Risk" count on dashboard
2. Click user → view "Findings" 
3. Execute "Recommendations" from modal
4. Track remediation progress
```

### Compliance Officer
```
Monthly Report:
1. Export data from /api/risk-data
2. Filter for stale admin accounts
3. Document least-privilege violations
4. Audit system access scope
```

### IT Operations
```
Access Review:
1. Search by department
2. Identify privilege scope creep
3. Validate "Systems Access" list
4. Plan permission cleanups
```

---

## 🚀 Full Setup Guide

### Requirements
- Python 3.9+
- Node.js 16+
- 5 minutes of setup time

### Manual Setup
```bash
# Backend Setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python risk_scorer.py     # Generate risk data
python app.py             # Start API server

# Frontend Setup (New Terminal)
cd frontend
npm install
npm run dev               # Start dev server
```

Then open: **http://localhost:5173**

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [DASHBOARD_SETUP.md](./DASHBOARD_SETUP.md) | Complete setup & configuration guide |
| [API Documentation](./DASHBOARD_SETUP.md#-api-endpoints) | REST API endpoint reference |
| [Risk Scoring](./DASHBOARD_SETUP.md#-how-risk-scoring-works) | Scoring algorithm & risk factors |

---

## 🔌 API Examples

### Get All Users
```bash
curl http://localhost:5000/api/risk-data | jq '.[0]'
```

### Get User Details
```bash
curl http://localhost:5000/api/user/USR00088
```

### Get Statistics
```bash
curl http://localhost:5000/api/risk-stats
```

### Get Top 20 Risky Users
```bash
curl http://localhost:5000/api/top-risks
```

---

## 📊 Dashboard Walkthrough

### Main Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│ 🔐 Identity Risk Dashboard                   [Last Updated]  │
├─────────────────────────────────────────────────────────────┤
│ [🚨 12 Critical] [⚠️ 45 High] [⚡ 89 Medium] [✅ 154 Low]   │
├─────────────────────────────────────────────────────────────┤
│ [Risk Distribution Chart] [Risk by Privilege Chart]         │
├─────────────────────────────────────────────────────────────┤
│ [Search Box] [Filter: All] [Critical] [High] [Medium] [Low]│
├─────────────────────────────────────────────────────────────┤
│ Top Risk Users Table (click Details to expand)              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ User ID    | Username | Dept | Risk Level | Actions │   │
│ │ USR00088   | w.jang   | Eng  | CRITICAL   | Details │   │
│ │ USR00027   | p.sully  | Sup  | CRITICAL   | Details │   │
│ └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### User Details Modal
```
Click "Details" to see:
├─ Profile Information (Email, Dept, Title)
├─ Risk Assessment (Score, Level, Confidence)
├─ Access Profile (Privilege, Systems)
├─ ⚠️ Risk Findings (What's risky)
├─ ✅ Recommendations (What to do)
└─ 📋 Explanation (Why it matters)
```

---

## 🎨 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | TypeScript + Vite + Tailwind CSS |
| **Charts** | Chart.js (Risk Distribution) |
| **Backend** | Python Flask + CORS |
| **Data** | Pandas + Scikit-learn (risk scoring) |
| **API** | REST (10+ endpoints) |

---

## 🔧 Customization

### Change Risk Scoring
Edit `backend/risk_scorer.py`:
```python
PRIVILEGE_SCORES = {"user": 10, "power-user": 25, "admin": 40}  # Adjust weights
```

### Change Dashboard Colors
Edit `frontend/src/style.css`:
```css
--critical: #ef4444;  /* Red for critical */
--high: #f97316;      /* Orange for high */
```

### Add Custom API Endpoint
Edit `backend/app.py`:
```python
@app.route('/api/your-endpoint', methods=['GET'])
def your_endpoint():
    # Your logic here
    return jsonify(data), 200
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Backend won't start** | Check Python 3.9+, run `pip install -r requirements.txt` |
| **Frontend won't load** | Ensure backend running on :5000, check browser console |
| **CSV not found** | Run `python risk_scorer.py` in backend dir first |
| **Port already in use** | Change port in scripts or kill existing process |

See [DASHBOARD_SETUP.md](./DASHBOARD_SETUP.md#-troubleshooting) for more help.

---

## 📈 Key Metrics Explained

### Risk Score (0-100)
- **90-100**: CRITICAL - Immediate investigation
- **70-89**: HIGH - Review within 1 week  
- **40-69**: MEDIUM - Monitor and schedule review
- **0-39**: LOW - Normal risk profile

### Confidence (0-100%)
- Evidence strength for the risk assessment
- Higher = more certain about the risk
- Based on number of risk indicators found

### Days Inactive
- How long since last login
- >30 days = stale account risk
- >60 days = high-priority remediation

---

## 💡 Pro Tips

1. **Start with Filters** - Check "Critical" risk users first
2. **Read Findings** - Understand why each user is flagged
3. **Follow Recommendations** - Execute suggested actions
4. **Track Progress** - Re-run risk_scorer.py weekly
5. **Export Data** - Use `/api/risk-data` for reports

---

## 🔐 Security Notes

⚠️ **This dashboard exposes sensitive user information:**
- Restrict access to security team only
- Use HTTPS in production
- Implement authentication layer
- Audit all dashboard access
- Don't expose public IP of backend

---

## 📞 Support & Questions

1. Check [DASHBOARD_SETUP.md](./DASHBOARD_SETUP.md)
2. Review [API Documentation](./DASHBOARD_SETUP.md#-api-endpoints)
3. Check browser console (F12) for errors
4. Verify backend health: `curl http://localhost:5000/api/health`

---

## 📄 What's Included

```
├── backend/
│   ├── risk_scorer.py          # Risk analysis engine
│   ├── app.py                  # Flask API server
│   ├── risk_scored_users.csv   # Generated risk data
│   └── requirements.txt         # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── main.ts             # Dashboard logic
│   │   └── style.css           # Dashboard styling
│   ├── index.html              # HTML template
│   ├── package.json            # Node dependencies
│   └── vite.config.ts          # Vite config with API proxy
│
├── start.sh                     # Linux/macOS startup script
├── start.bat                    # Windows startup script
├── DASHBOARD_SETUP.md           # Detailed setup guide
└── README.md                    # This file
```

---

## 🎓 Learning Resources

- **Flask**: https://flask.palletsprojects.com/
- **TypeScript**: https://www.typescriptlang.org/
- **Vite**: https://vitejs.dev/
- **Chart.js**: https://www.chartjs.org/
- **Risk Analysis**: https://nist.gov/publications/detail/sp-800-53

---

## 📈 Feature Roadmap

- [ ] Real-time alert notifications
- [ ] Behavioral clustering (ML)
- [ ] Separation of duties detection
- [ ] Compliance gap analysis
- [ ] Integration with Okta/Azure AD APIs
- [ ] DLP (Data Loss Prevention) integration
- [ ] Automated remediation playbooks
- [ ] Department-level anomaly detection

---

## 📄 License

Educational & Enterprise Use

---

## 🎉 Ready?

```bash
# macOS / Linux
./start.sh

# Windows
start.bat

# Or manual setup
cd backend && python app.py &
cd frontend && npm run dev
```

**Dashboard ready at:** http://localhost:5173 🚀

---

**Happy Securing! 🔐**

*Build for the enterprise, test for the edge cases, deploy with confidence.*
