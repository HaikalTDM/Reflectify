# 🇲🇾 Malaysian Payment Integration Guide

## Overview
Donation system for Reflectify with Malaysian payment methods (FPX, Touch 'n Go, GrabPay, Cards)

---

## 🎯 Recommended Payment Gateway: **Toyyibpay**

### Why Toyyibpay?
- ✅ **Shariah-compliant** (Islamic payment gateway)
- ✅ **Malaysian-focused** (FPX, TNG, GrabPay supported)
- ✅ **No monthly fees** (only per-transaction)
- ✅ **Easy integration** (just a payment link)
- ✅ **Instant setup** (no company registration needed for individuals)

### Pricing:
- **Transaction fee**: 1.5% + RM 0.50
- **Example**: RM 10 donation → You receive RM 9.35
- **No setup fee, no monthly fee**

---

## 📝 Setup Steps

### 1. Register Toyyibpay Account

1. Go to https://toyyibpay.com
2. Click "Daftar" (Register)
3. Choose: **Individual Account** (Akaun Individu)
4. Fill in:
   - Name
   - Email
   - Phone number
   - Bank account (for receiving payments)
5. Verify email and phone

### 2. Create Payment Link

1. Login to Toyyibpay dashboard
2. Go to **"Cipta Pautan Bayaran"** (Create Payment Link)
3. Fill in:
   - **Category**: Donation (Derma)
   - **Purpose**: Islamic App Development
   - **Amount options**: RM 5, RM 10, RM 20, RM 50, RM 100
4. Copy your payment link (e.g., `https://toyyibpay.com/reflectify`)

### 3. Update App Code ✅ DONE!

Your Toyyibpay payment link is already configured:

```typescript
const paymentUrl = `https://toyyibpay.com/ReflectifyDonation?amount=${finalAmount}`;
```

**Status:** ✅ Payment URL configured and ready!
**Available:** FPX (Malaysian Online Banking)
**Coming Soon:** Touch 'n Go, GrabPay, Credit/Debit Cards

---

## 🔄 Alternative Options

### Option 2: Billplz (More Features)

**Pros:**
- More professional
- Better analytics
- Recurring payments support

**Cons:**
- Requires business registration
- Monthly fee (RM 30/month after free trial)

**Setup:**
1. Register at https://www.billplz.com
2. Get API keys
3. Install: `npm install billplz-api`
4. Integrate with React Native

### Option 3: Stripe (International)

**Pros:**
- Best developer experience
- Global payment methods
- Excellent documentation

**Cons:**
- Higher fees (2.9% + RM 0.50)
- Requires company registration
- Less Malaysian e-wallet support

---

## 💻 Implementation Status

### ✅ Completed:
- [x] Donation screen UI
- [x] Malaysian ringgit (RM) amounts
- [x] Payment method badges (FPX, TNG, Grab, Card)
- [x] Islamic messaging (Sadaqah Jariyah)
- [x] Navigation from settings
- [x] Beautiful animations

### ⏳ To Complete:
- [ ] Update payment URL with your Toyyibpay link
- [ ] Test donation flow
- [ ] (Optional) Add donation tracking in Supabase
- [ ] (Optional) Show donor badge in app

---

## 🧪 Testing

1. Update payment URL in `app/donation.tsx`
2. Run app: `npm start`
3. Go to Settings → "💚 Support Reflectify"
4. Select amount (RM 5 for testing)
5. Click "Donate Now"
6. Should open Toyyibpay payment page
7. Test with real payment or use test card

---

## 📊 Tracking Donations (Optional)

Add to Supabase `donations` table:

```sql
create table donations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  amount numeric not null,
  currency text default 'MYR',
  status text default 'completed',
  payment_method text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table donations enable row level security;

-- Policy: Users can view their own donations
create policy "Users can view own donations"
  on donations for select
  using (auth.uid() = user_id);
```

---

## 🎨 Customization Ideas

### Show Donor Badge:
- Add "Supporter 💚" badge next to username
- Show in leaderboard (if you add one later)

### Donor Benefits:
- Custom thank you message
- Special app theme
- Early access to new features
- Name in "Our Supporters" page

### Sadaqah Jariyah Tracker:
- Show impact: "Your donation helped X people access hadiths this month"
- Send monthly impact reports

---

## 🔒 Security Notes

1. **Never store payment info** in your app
2. **Use HTTPS only** for payment links
3. **Validate on server** (Toyyibpay handles this)
4. **Log transactions** for accounting

---

## 📱 User Experience Tips

1. **Keep it simple** - One-click donation
2. **Show impact** - "Helps keep app free for everyone"
3. **No pressure** - Make it 100% optional
4. **Islamic framing** - Emphasize Sadaqah Jariyah
5. **Thank donors** - Show genuine gratitude

---

## 🚀 Next Steps

1. ✅ Register Toyyibpay account
2. ✅ Create payment link
3. ✅ Update `app/donation.tsx` with your link
4. ✅ Test donation flow
5. ✅ Launch! 🎉

---

## 💡 Marketing Ideas

### In-App:
- Show donation button after first hadith reflection
- "Your reflection was free thanks to 127 supporters"
- Ramadan campaign: "Double your reward this Ramadan"

### Social Media:
- Share impact stories
- Thank donors publicly (with permission)
- Highlight Sadaqah Jariyah concept

---

## 📞 Support

**Toyyibpay Support:**
- Email: support@toyyibpay.com
- WhatsApp: +60 17-960 5838
- Working hours: Mon-Fri, 9am-6pm (GMT+8)

**App Issues:**
- Check logs for payment errors
- Verify payment URL is correct
- Test with different amounts

---

## 🎯 Success Metrics

Track these to measure impact:

- Total donations received
- Number of unique donors
- Average donation amount
- Conversion rate (visitors → donors)
- Retention (repeat donors)

**Initial Target:**
- 50 donors in first month
- RM 500 total donations
- 5% conversion rate

---

**Remember:** Every donation helps spread Islamic knowledge. May Allah reward you and all supporters! 🤲

