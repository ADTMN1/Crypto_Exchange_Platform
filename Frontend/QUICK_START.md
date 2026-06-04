# 🚀 Quick Start - Testing Real API Integration

## Prerequisites
- Backend running on `http://localhost:5000`
- Admin account exists in database
- You are logged in as admin

---

## Step 1: Start Backend (Terminal 1)
```bash
cd Backend
npm run dev
```

**Expected output:**
```
🔗 Database Connection String: [REDACTED]
✅ PostgreSQL successfully connected to Neon Database
🚀 Server is listening on port 5000
```

---

## Step 2: Start Frontend (Terminal 2)
```bash
cd Frontend
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## Step 3: Login as Admin

1. Go to `http://localhost:5173/login`
2. Login with admin credentials
3. You should be redirected to admin dashboard

---

## Step 4: Navigate to Users Page

**URL:** `http://localhost:5173/admin/users`

**What you should see:**
- ✅ Real users from your PostgreSQL database
- ✅ User avatars with initials
- ✅ Email addresses
- ✅ Status badges (Active/Pending/Banned)
- ✅ Role badges (Admin/User)
- ✅ Verification badges (Email/Phone/2FA)
- ✅ Search box at top right

---

## Step 5: Test Search

1. Type in search box (e.g., "john")
2. Wait 500ms (debounce)
3. Table should update with matching users

---

## Step 6: Check Browser Console

**Open DevTools (F12) → Console tab**

**Expected logs:**
```
Received registration request: {...}
Login success: {...}
⚡ Executed Query: [...] in XXms | Rows: X
```

**No errors should appear!**

---

## Step 7: Test API Directly (Optional)

### Using curl:
```bash
# Get all users (must be logged in)
curl -X GET http://localhost:5000/api/admin/users \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  --cookie-jar cookies.txt

# Search users
curl -X GET "http://localhost:5000/api/admin/users?search=john" \
  -H "Cookie: token=YOUR_JWT_TOKEN"

# Get active users only
curl -X GET http://localhost:5000/api/admin/users/active \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

### Using browser DevTools:
1. Open Network tab (F12)
2. Refresh users page
3. Look for request to `/api/admin/users`
4. Status should be `200 OK`
5. Response shows real JSON data

---

## 🐛 Common Issues & Fixes

### Issue 1: "Cannot connect to backend"
**Error:** Network error in console  
**Fix:**
- Verify backend is running on port 5000
- Check `.env` has `VITE_API_BASE_URL=http://localhost:5000`
- Restart frontend after changing `.env`

### Issue 2: "401 Unauthorized"
**Error:** API returns 401  
**Fix:**
- Login again (token expired)
- Clear cookies and login fresh
- Verify you're logged in as admin

### Issue 3: "Empty table / No users"
**Error:** Table shows "No users found"  
**Fix:**
- Check backend logs for errors
- Verify database has users:
  ```sql
  SELECT * FROM users LIMIT 10;
  ```
- Run seed script if database is empty

### Issue 4: "CORS error"
**Error:** CORS policy blocks request  
**Fix:**
- Backend `.env` should have:
  ```
  ALLOWED_ORIGINS=http://localhost:5173
  ```
- Restart backend after changing

---

## ✅ Success Checklist

- [ ] Backend running without errors
- [ ] Frontend running on port 5173
- [ ] Can login as admin
- [ ] Users page shows real data (not mock)
- [ ] Search filters results
- [ ] No console errors
- [ ] Network tab shows successful API calls
- [ ] Status badges display correctly

---

## 🎉 Next Features to Test

Once basic integration works, test these:

1. **Click "Details" button** → Should navigate to user detail page
2. **Ban a user** (when implemented)
3. **Filter by status** (when implemented)
4. **Pagination** (when implemented)

---

## 📊 What Data is Real vs Mocked?

### ✅ Real Data (From Database):
- User list
- Email addresses
- Usernames
- Account status
- Roles
- Verification status
- Creation dates
- Last login dates

### ❌ Still Mocked (Not Integrated Yet):
- User detail page
- Ban/unban actions
- Status update actions
- Other admin pages (transactions, orders, etc.)

---

## 🔄 Development Workflow

1. Make changes to code
2. Frontend auto-reloads (Vite HMR)
3. Backend auto-reloads (nodemon)
4. Refresh browser to see changes
5. Check console for errors

---

## 📝 Testing Checklist

Run through this list to verify integration:

```
□ Backend starts without errors
□ Frontend starts without errors
□ Can login as admin
□ Admin dashboard loads
□ Navigate to /admin/users
□ See loading spinner briefly
□ Real users appear in table
□ User count shows at bottom
□ Search box visible
□ Type in search → results filter
□ Click "Details" → navigates to detail page
□ No console errors
□ Network tab shows 200 status codes
```

---

**Ready to test!** 🚀

If everything works, your frontend is now fully connected to your PostgreSQL database through your Express backend!
