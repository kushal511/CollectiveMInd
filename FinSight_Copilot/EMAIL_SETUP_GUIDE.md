# 📧 EMAIL SENDING GUIDE

## ✅ EMAIL FEATURE IS NOW READY!

Your UI now has **real email sending capability**!

---

## 🎯 HOW IT WORKS:

### **Option 1: Demo Mode (Current - No Setup Required)**
When you click "Send Email":
- Email is saved to `covenant-copilot/apps/api/emails/` folder
- You can open the HTML file to see the formatted email
- Perfect for demos and testing

### **Option 2: Real Email Sending (With Gmail Setup)**
Configure SMTP to send actual emails to any address!

---

## 🔧 SETUP REAL EMAIL SENDING (Optional):

### **Step 1: Get Gmail App Password**

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** → **2-Step Verification** (enable if not already)
3. Scroll down to **App passwords**
4. Click **App passwords**
5. Select **Mail** and **Other (Custom name)**
6. Enter "Covenant Copilot"
7. Click **Generate**
8. Copy the 16-character password

### **Step 2: Update .env File**

Add these lines to your `.env` file:

```bash
# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=your.email@gmail.com
EMAIL_PASSWORD=your_16_char_app_password_here
```

### **Step 3: Restart Backend**

```bash
cd covenant-copilot/apps/api
lsof -ti:8000 | xargs kill -9
venv/bin/uvicorn main:app --reload --port 8000 --host 0.0.0.0
```

---

## 🎬 HOW TO USE IN YOUR DEMO:

### **Step 1: Run Covenant Check**
```
Click "Run Covenant Check"
↓
Results appear
↓
2 seconds later: Toast notification "📧 Email Alert Sent!"
```

### **Step 2: View Email Preview**
```
Click "View Email Alert" button (orange/red)
↓
Modal opens showing full email
↓
See recipients, subject, and formatted content
```

### **Step 3: Send Actual Email**
```
Enter your email address in the input field
↓
Click "Send Email" button
↓
Button shows "Sending..."
↓
Success! "Email Sent Successfully!"
↓
Check your inbox!
```

---

## 📧 WHAT THE EMAIL CONTAINS:

### **Professional HTML Email with:**

1. **Header**
   - Red gradient banner
   - "🚨 COVENANT BREACH ALERT"
   - Subtitle: "Automated Breach Notification"

2. **Alert Box**
   - "⚠️ IMMEDIATE ACTION REQUIRED"
   - Company and period info

3. **Breach Details**
   - Covenant: Leverage Ratio
   - Actual: 3.78x
   - Limit: 3.5x
   - Variance: -0.28x (8% over limit)

4. **Complete Results Table**
   - All three covenant tests
   - Color-coded (red for breach, green for pass)
   - Actual vs Limit comparison

5. **Financial Metrics**
   - Total Debt: $4,994M
   - EBITDA: $1,322M
   - Interest Expense: $162M
   - Cash: $15,587M

6. **Recommended Actions**
   - 5-point action plan
   - Numbered list with bold headers

7. **Footer**
   - System information
   - Timestamp
   - Data sources

---

## 🎯 FOR LINKEDIN DEMO:

### **Narration Script:**

*"When a breach is detected, the system automatically sends email alerts..."*

[Toast appears]

*"Here's the email that was sent to the CFO, legal team, and analysts..."*

[Click "View Email Alert"]

*"The email includes complete breach details, financial metrics, and recommended actions..."*

[Scroll through email preview]

*"And I can send this to anyone instantly..."*

[Enter your email]

[Click "Send Email"]

*"There! Check your inbox - you'll receive the full breach alert in seconds."*

---

## ✅ CURRENT STATUS:

**Without SMTP Setup:**
- ✅ Email preview works
- ✅ Email saved to file
- ✅ Perfect for demos
- ✅ No configuration needed

**With SMTP Setup:**
- ✅ Sends real emails
- ✅ To any email address
- ✅ Professional HTML formatting
- ✅ Instant delivery

---

## 🚀 DEMO TIPS:

### **For Quick Demo (No Email Setup):**
1. Show email preview modal
2. Explain: "In production, this sends to stakeholders automatically"
3. Show the saved email file

### **For Full Demo (With Email Setup):**
1. Enter your email address
2. Click "Send Email"
3. Check inbox on phone/another screen
4. Show the actual email received
5. **WOW FACTOR!** 🎉

---

## 📱 MOBILE DEMO TRICK:

1. Enter your phone's email
2. Send the alert
3. Pull out your phone
4. Show the email arriving in real-time
5. Open it and show the formatted content

**This creates HUGE impact for LinkedIn videos!**

---

## 🎨 EMAIL LOOKS PROFESSIONAL:

- ✅ Red gradient header
- ✅ Color-coded status (red/green)
- ✅ Professional table formatting
- ✅ Action-oriented recommendations
- ✅ Complete financial breakdown
- ✅ System attribution footer

---

## 🏆 YOUR COMPLETE SYSTEM NOW HAS:

1. ✅ Document upload
2. ✅ AI-powered analysis
3. ✅ Breach detection
4. ✅ **Real email sending**
5. ✅ **Professional HTML emails**
6. ✅ Memo generation
7. ✅ Conversational chatbot
8. ✅ Live monitoring

**Everything works! Ready for LinkedIn! 🚀**

---

## 🔧 TROUBLESHOOTING:

### **Email not sending?**
- Check `.env` file has correct credentials
- Restart backend after updating `.env`
- Check spam folder
- Verify Gmail app password is correct

### **Button says "Failed to send"?**
- Backend might not be running
- Check console for errors
- Verify API endpoint is accessible

### **Want to test without setup?**
- Just use demo mode!
- Email saves to file
- Open the HTML file to see it

---

## 📧 READY TO IMPRESS!

**Refresh your browser and try:**
1. Run Covenant Check
2. Click "View Email Alert"
3. Enter your email
4. Click "Send Email"
5. Check your inbox!

**The email will look AMAZING! 🎉**
