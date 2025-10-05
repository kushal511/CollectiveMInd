# 📧 SETUP REAL EMAIL SENDING - STEP BY STEP

## 🎯 Follow These Steps to Send Real Emails:

---

## Step 1: Get Gmail App Password (2 minutes)

### **Option A: Direct Link**
1. Click this link: https://myaccount.google.com/apppasswords
2. Sign in with your Gmail account
3. You'll see "App passwords" page

### **Option B: Manual Navigation**
1. Go to: https://myaccount.google.com/
2. Click **Security** (left sidebar)
3. Under "How you sign in to Google", click **2-Step Verification**
   - If not enabled, enable it first
4. Scroll down to **App passwords**
5. Click **App passwords**

### **Create App Password:**
1. In "Select app" dropdown: Choose **Mail**
2. In "Select device" dropdown: Choose **Other (Custom name)**
3. Type: `Covenant Copilot`
4. Click **Generate**
5. **COPY THE 16-CHARACTER PASSWORD** (example: `abcd efgh ijkl mnop`)
   - Remove the spaces when you paste it
   - It will look like: `abcdefghijklmnop`

---

## Step 2: Update .env File (1 minute)

### **I already added the template to your .env file!**

Now you just need to replace the placeholder values:

1. Open: `/Users/mac_kushal/Desktop/FinSight_Copilot/.env`
2. Find these lines:
   ```
   EMAIL_FROM=your.email@gmail.com
   EMAIL_PASSWORD=your_16_char_app_password_here
   ```
3. Replace with your actual values:
   ```
   EMAIL_FROM=yourname@gmail.com
   EMAIL_PASSWORD=abcdefghijklmnop
   ```

### **Example:**
```bash
EMAIL_FROM=john.doe@gmail.com
EMAIL_PASSWORD=xyzw1234abcd5678
```

**Important:** Remove all spaces from the app password!

---

## Step 3: Restart Backend (30 seconds)

Run these commands:

```bash
cd /Users/mac_kushal/Desktop/FinSight_Copilot/covenant-copilot/apps/api

# Kill old backend
lsof -ti:8000 | xargs kill -9

# Start new backend with email config
venv/bin/uvicorn main:app --reload --port 8000 --host 0.0.0.0
```

**Or use this one-liner:**
```bash
cd /Users/mac_kushal/Desktop/FinSight_Copilot/covenant-copilot/apps/api && lsof -ti:8000 | xargs kill -9 && sleep 1 && venv/bin/uvicorn main:app --reload --port 8000 --host 0.0.0.0
```

---

## Step 4: Test It! (1 minute)

1. Refresh your browser: http://localhost:3001/final_demo_ui.html
2. Click "Run Covenant Check"
3. Click "View Email Alert"
4. Enter YOUR email address
5. Click "Send Email"
6. **Check your Gmail inbox!** 📧

---

## ✅ Success Indicators:

When it works, you'll see:
1. Button changes to "Sending..." with spinner
2. Button turns green: "Sent!"
3. Toast notification: "Email Sent Successfully!"
4. **Email appears in your Gmail inbox within seconds!**

---

## 🎯 Quick Copy-Paste Commands:

### **After you update .env with your credentials:**

```bash
# Navigate to API folder
cd /Users/mac_kushal/Desktop/FinSight_Copilot/covenant-copilot/apps/api

# Restart backend
lsof -ti:8000 | xargs kill -9 && sleep 1 && venv/bin/uvicorn main:app --reload --port 8000 --host 0.0.0.0 &

# Wait 3 seconds
sleep 3

# Test if backend is running
curl http://localhost:8000

# If you see {"message":"Covenant Monitoring Copilot API","version":"1.0.0"}
# Then it's working! Go test the email!
```

---

## 🔧 Troubleshooting:

### **"Failed to send email"**
- Check .env file has correct email and password
- Make sure you removed spaces from app password
- Restart backend after updating .env

### **"Invalid credentials"**
- App password might be wrong
- Generate a new app password
- Make sure 2-Step Verification is enabled on Gmail

### **Email not arriving**
- Check spam folder
- Wait 1-2 minutes (sometimes delayed)
- Try sending to a different email

### **Backend not starting**
- Check if port 8000 is already in use
- Kill all processes: `lsof -ti:8000 | xargs kill -9`
- Try again

---

## 📧 What the Email Will Look Like:

**Subject:** 🚨 COVENANT BREACH ALERT - Tesla Inc. (Q2 2025)

**From:** Your Gmail (alerts@finsight.ai display name)

**Content:**
- Professional red gradient header
- Complete breach details
- Financial metrics table
- Recommended actions
- Clickable button to view full report
- System attribution footer

**It looks AMAZING!** 🎉

---

## 🎬 For LinkedIn Demo:

Once set up, you can:
1. Enter your email in the UI
2. Click "Send Email"
3. Pull out your phone
4. Show the email arriving in real-time
5. Open it and show the professional formatting

**HUGE impact for your demo!** 🚀

---

## ⚡ FASTEST SETUP (All-in-One):

1. Get Gmail app password: https://myaccount.google.com/apppasswords
2. Edit `.env` file with your credentials
3. Run this command:
   ```bash
   cd /Users/mac_kushal/Desktop/FinSight_Copilot/covenant-copilot/apps/api && lsof -ti:8000 | xargs kill -9 && sleep 1 && venv/bin/uvicorn main:app --reload --port 8000 --host 0.0.0.0
   ```
4. Test in browser!

**Total time: 5 minutes!** ⏱️

---

## 🏆 YOU'RE READY!

Once you complete these steps:
- ✅ Real emails will be sent
- ✅ To any email address you enter
- ✅ Professional HTML formatting
- ✅ Instant delivery
- ✅ Perfect for LinkedIn demo!

**Let's get your emails working! 🚀**
