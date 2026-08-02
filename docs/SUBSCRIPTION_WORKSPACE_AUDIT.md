# PoultryOps Subscription Workspace Audit

**Document Version:** 1.0  
**Date:** 2026-01-08  
**Status:** READ-ONLY AUDIT - NO FUNCTIONAL CHANGES PERMITTED  
**Purpose:** Complete inspection and documentation of the Subscription Workspace implementation

---

## Table of Contents

1. [UI Components](#1-ui-components)
2. [Pages](#2-pages)
3. [API Routes](#3-api-routes)
4. [Flutterwave Integration](#4-flutterwave-integration)
5. [Database Schema & Usage](#5-database-schema--usage)
6. [Business Logic](#6-business-logic)
7. [Dependency Analysis](#7-dependency-analysis)
8. [Dependency Map](#8-dependency-map)
9. [Risk Assessment](#9-risk-assessment)

---

## 1. UI Components

### 1.1 Subscription Page Component
**File:** `app/settings/subscription/page.tsx`  
**Type:** Client Component ("use client")  
**Responsibility:** Main subscription management interface

**Key Features:**
- Displays current subscription status and plan details
- Shows trial countdown or next billing date
- Renders pricing plan cards (Solo, Team, Business)
- Handles payment initiation via Flutterwave Checkout
- Displays payment history table
- Shows user limits based on plan

**State Management:**
- `subscription` - Current subscription data
- `payments` - Payment history array
- `loading` - Payment verification overlay state
- `subLoading` - Subscription data loading state
- `paymentsLoading` - Payment history loading state
- `paymentsError` - Payment history error state

**User Interactions:**
- Subscribe Monthly/Annual buttons for each plan
- Refresh payment history button
- Payment verification overlay during processing

---

### 1.2 Subscription Card Component
**File:** `components/dashboard/subscription-card.tsx`  
**Type:** Presentational Component  
**Responsibility:** Display subscription summary on dashboard

**Props:**
- `plan` - Subscription plan name
- `status` - Subscription status
- `daysRemaining` - Days left in trial/renewal period

**Current Status:** Simple display component showing basic subscription info. Appears to be a basic/legacy component.

---

## 2. Pages

### 2.1 Subscription Settings Page
**Route:** `/settings/subscription`  
**File:** `app/settings/subscription/page.tsx`  
**Access Path:** Settings → Subscription  
**Access Control:** Protected by authentication (uses `useAuth` hook)

**How Users Reach This Page:**
1. User navigates to Settings
2. Clicks on "Subscription" or "Billing & Subscription" link
3. Page loads subscription data and payment history
4. User can view current plan, pricing options, and payment history

**Page Sections:**
1. **Header** - Page title and description
2. **Summary Cards** - Current Plan, Renewal/Trial, User Limit, Billing Cycle
3. **Subscription Overview** - Detailed current plan display with status badge
4. **Pricing Plans** - Three plan cards (Solo, Team, Business) with monthly/annual pricing
5. **Payment History** - Table showing past payments with status badges

---

### 2.2 Dashboard Page
**Route:** `/dashboard`  
**File:** `app/dashboard/page.tsx`  
**Access Path:** Direct route after login  
**Access Control:** Owner-only (wrapped in `<OwnerOnly>` component)

**Subscription-Related Features:**
- Displays "Trial Active" badge (hardcoded in current implementation)
- Shows farm statistics (birds, production, revenue, expenses, profit)
- Does NOT currently display dynamic subscription data from database

**Note:** Dashboard shows a hardcoded "Trial Active" badge rather than pulling real-time subscription status.

---

## 3. API Routes

### 3.1 Payment Verification
**Route:** `POST /api/payments/verify`  
**File:** `app/api/payments/verify/route.ts`  
**Purpose:** Verify Flutterwave payment and activate subscription

**Request Body:**
```json
{
  "transaction_id": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment already processed" // if duplicate
}
```

**Process:**
1. Validates transaction_id exists
2. Checks if payment already processed (idempotency)
3. Calls Flutterwave API to verify transaction
4. Extracts metadata (farm_id, plan, billing_cycle)
5. Updates subscriptions table with payment details
6. Inserts payment record into payments table
7. Sends email notifications (payment received, subscription activated/renewed)

**Critical:** This is the ONLY route that modifies subscription status from trial to active.

---

### 3.2 Payment History
**Route:** `GET /api/payments/history?farmId={farmId}`  
**File:** `app/api/payments/history/route.ts`  
**Purpose:** Retrieve payment history for a farm

**Query Parameters:**
- `farmId` (required) - Farm identifier

**Response:**
```json
{
  "success": true,
  "payments": [
    {
      "id": "string",
      "plan": "string",
      "billing_cycle": "string",
      "amount_paid": "number",
      "transaction_id": "string",
      "payment_reference": "string",
      "status": "string",
      "created_at": "string"
    }
  ]
}
```

---

### 3.3 Team Management
**Route:** `GET /api/team` and `POST /api/team`  
**File:** `app/api/team/route.ts`  
**Purpose:** Manage team members with subscription limit enforcement

**GET:** Retrieve all team members for current farm  
**POST:** Create new team member (checks subscription limits)

**Subscription Integration:**
- POST endpoint calls `createUser()` from `lib/users/create-user.ts`
- `createUser()` checks subscription plan and enforces user limits
- Returns error if limit reached for current plan

---

### 3.4 Email Automation
**Route:** `POST /api/run-email-automation`  
**File:** `app/api/run-email-automation/route.ts`  
**Purpose:** Automated trial email notifications (cron job)

**Authentication:** Requires `AUTOMATION_SECRET` header

**Process:**
1. Queries all trial subscriptions
2. Buckets by trial_end date:
   - Expired (trial_end < now)
   - 1 day warning (trial_end < now + 2 days)
   - 3 day warning (trial_end < now + 4 days)
3. Sends appropriate email for each bucket
4. Returns summary of sent/errored emails

**Email Types:**
- `trial_expired` - Trial has ended
- `trial_1_day` - 1 day remaining
- `trial_3_days` - 3 days remaining

---

### 3.5 Email Trigger Routes
**Routes:**
- `POST /api/send-subscription-activated` - Trigger subscription activated email
- `POST /api/send-subscription-renewed` - Trigger subscription renewed email
- `POST /api/send-payment-received` - Trigger payment received email

**Files:**
- `app/api/send-subscription-activated/route.ts`
- `app/api/send-subscription-renewed/route.ts`
- `app/api/send-payment-received/route.ts`

**Purpose:** Manual triggers for transactional emails (used by payment verification flow)

---

## 4. Flutterwave Integration

### 4.1 Configuration
**File:** `lib/flutterwave.ts`  
**Purpose:** Define plans and provide public key

**Plan Definitions:**
```typescript
export const PLANS = {
  solo: {
    name: "Solo",
    monthly: 10000,    // ₦10,000
    annual: 108000,    // ₦108,000 (saves ₦12,000)
    users: 1
  },
  team: {
    name: "Team",
    monthly: 15000,    // ₦15,000
    annual: 162000,    // ₦162,000 (saves ₦18,000)
    users: 3
  },
  business: {
    name: "Business",
    monthly: 20000,    // ₦20,000
    annual: 216000,    // ₦216,000 (saves ₦24,000)
    users: 6
  }
}
```

**Public Key Function:**
```typescript
export function getFlutterwavePublicKey() {
  return process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || ""
}
```

---

### 4.2 Payment Flow

**Step-by-Step Process:**

1. **User clicks "Subscribe Monthly" or "Subscribe Annual"**
   - Location: `app/settings/subscription/page.tsx` - `payNow()` function
   - Plan and billing cycle passed as parameters

2. **Flutterwave Checkout Initialized**
   ```javascript
   window.FlutterwaveCheckout({
     public_key: getFlutterwavePublicKey(),
     tx_ref: `POULTRYOPS-${Date.now()}`,
     amount: selectedPlan.monthly || selectedPlan.annual,
     currency: "NGN",
     payment_options: "card,banktransfer,ussd",
     customer: {
       email: profile.email,
       name: profile.full_name
     },
     customizations: {
       title: "PoultryOps Subscription",
       description: `${selectedPlan.name} Plan`
     },
     meta: {
       farm_id: profile.farm_id,
       plan: plan,
       billing_cycle: billingCycle
     },
     callback: async (response) => {
       // Step 3 happens here
     }
   })
   ```

3. **Payment Success Callback**
   - User completes payment on Flutterwave
   - Flutterwave returns `transaction_id`
   - Frontend calls `/api/payments/verify` with transaction_id

4. **Backend Verification** (`app/api/payments/verify/route.ts`)
   - Checks if payment already processed (idempotency check)
   - Calls Flutterwave API: `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`
   - Uses `FLUTTERWAVE_SECRET_KEY` for authentication
   - Validates payment status is "successful"

5. **Database Updates**
   - Updates `subscriptions` table:
     - `plan` - Selected plan
     - `status` - "active"
     - `billing_cycle` - monthly or annual
     - `payment_reference` - Flutterwave tx_ref
     - `transaction_id` - Flutterwave transaction ID
     - `amount_paid` - Amount from Flutterwave
     - `next_billing_date` - Calculated based on billing cycle
   - Inserts record into `payments` table

6. **Email Notifications**
   - Determines if activation or renewal:
     - Activation: Previous status was "trial"
     - Renewal: Previous status was not "trial" OR multiple successful payments exist
   - Sends emails in parallel:
     - `sendPaymentReceivedEmail()` - Always sent
     - `sendSubscriptionActivatedEmail()` - If activation
     - `sendSubscriptionRenewedEmail()` - If renewal

7. **Frontend Response**
   - Shows success alert
   - Reloads page to display updated subscription status

---

## 5. Database Schema & Usage

### 5.1 Subscriptions Table

**Table Name:** `subscriptions`  
**Primary Key:** `id` (implied)  
**Foreign Key:** `farm_id` → `farms.id`

#### Fields Documentation

| Field | Type | Where Read | Where Written | Files Using |
|-------|------|------------|---------------|-------------|
| `plan` | string | - `lib/users/create-user.ts` (lines 48-52, 76-91) - Enforces user limits<br>- `app/settings/subscription/page.tsx` (line 228) - Displays current plan<br>- `app/api/payments/verify/route.ts` (line 100) - Updates on payment<br>- `lib/onboarding.ts` (line 88) - Sets to "trial" | - `lib/onboarding.ts` (line 88) - Initial creation as "trial"<br>- `app/api/payments/verify/route.ts` (line 100) - Updated to paid plan | - `lib/subscription.ts`<br>- `lib/users/create-user.ts`<br>- `app/settings/subscription/page.tsx`<br>- `app/api/payments/verify/route.ts`<br>- `lib/onboarding.ts`<br>- `app/api/run-email-automation/route.ts` |
| `status` | string | - `app/settings/subscription/page.tsx` (line 239) - Displays status badge<br>- `app/api/payments/verify/route.ts` (lines 86-93) - Checks previous status for email logic<br>- `app/api/run-email-automation/route.ts` (line 46) - Queries trial status | - `lib/onboarding.ts` (line 89) - Sets to "trial"<br>- `app/api/payments/verify/route.ts` (line 101) - Sets to "active" | - `app/settings/subscription/page.tsx`<br>- `app/api/payments/verify/route.ts`<br>- `lib/onboarding.ts`<br>- `app/api/run-email-automation/route.ts` |
| `trial_start` | timestamp | - `app/settings/subscription/page.tsx` (line 31) - Type definition only, not displayed | - `lib/onboarding.ts` (line 90) - Set to current date on trial creation | - `lib/onboarding.ts`<br>- `app/settings/subscription/page.tsx` (type only) |
| `trial_end` | timestamp | - `app/settings/subscription/page.tsx` (lines 138-143) - Calculates days remaining<br>- `app/api/run-email-automation/route.ts` (lines 85-93) - Determines email bucket<br>- `lib/onboarding.ts` (line 91) - Set to current date + 14 days | - `lib/onboarding.ts` (line 91) - Set during trial creation | - `app/settings/subscription/page.tsx`<br>- `app/api/run-email-automation/route.ts`<br>- `lib/onboarding.ts` |
| `billing_cycle` | string (nullable) | - `app/settings/subscription/page.tsx` (lines 246-247) - Displays "Annual" or "Monthly"<br>- `app/api/payments/verify/route.ts` (line 69) - Read from metadata | - `app/api/payments/verify/route.ts` (line 102) - Set on payment | - `app/settings/subscription/page.tsx`<br>- `app/api/payments/verify/route.ts` |
| `next_billing_date` | timestamp (nullable) | - `app/settings/subscription/page.tsx` (line 255) - Displays renewal date<br>- `app/api/payments/verify/route.ts` (line 73-83) - Calculated based on billing cycle | - `app/api/payments/verify/route.ts` (line 106) - Set on payment | - `app/settings/subscription/page.tsx`<br>- `app/api/payments/verify/route.ts` |
| `amount_paid` | number | - Not directly read in frontend | - `app/api/payments/verify/route.ts` (line 105) - Set from Flutterwave verification | - `app/api/payments/verify/route.ts` |
| `payment_reference` | string | - `app/settings/subscription/page.tsx` (line 762) - Displayed in payment history (from payments table) | - `app/api/payments/verify/route.ts` (line 103) - Set from Flutterwave tx_ref | - `app/api/payments/verify/route.ts` |
| `transaction_id` | string | - `app/api/payments/verify/route.ts` (lines 27-31) - Checks for duplicate payments | - `app/api/payments/verify/route.ts` (line 104) - Set from Flutterwave | - `app/api/payments/verify/route.ts` |
| `selected_plan` | (not found in code) | N/A | N/A | N/A |

**Note:** The `selected_plan` field mentioned in the task does not exist in the current codebase. The plan is stored in the `plan` field.

---

### 5.2 Payments Table

**Table Name:** `payments`  
**Purpose:** Audit trail of all payment transactions

**Fields Used:**
- `id` - Primary key
- `farm_id` - Foreign key to farms
- `plan` - Plan name at time of payment
- `billing_cycle` - monthly or annual
- `amount_paid` - Amount in NGN
- `transaction_id` - Flutterwave transaction ID
- `payment_reference` - Flutterwave tx_ref
- `status` - Payment status (successful, pending, failed)
- `created_at` - Timestamp

**Where Used:**
- `app/api/payments/verify/route.ts` - Inserts payment records
- `app/api/payments/history/route.ts` - Retrieves payment history
- `app/settings/subscription/page.tsx` - Displays payment history

---

## 6. Business Logic

### 6.1 Trial Logic

**Trial Creation:**
- **When:** During onboarding (farm creation)
- **File:** `lib/onboarding.ts` (lines 72-92)
- **Duration:** 14 days from creation
- **Fields Set:**
  - `plan`: "trial"
  - `status`: "trial"
  - `trial_start`: Current timestamp
  - `trial_end`: Current timestamp + 14 days

**Trial Features:**
- 1 user limit (owner only)
- Full farm management access
- No payment required

**Trial Expiration:**
- Automated email system runs via cron job
- Emails sent at:
  - 3 days before expiration
  - 1 day before expiration
  - Day of expiration
- No automatic status change to "expired" - requires manual upgrade or payment

**Trial to Paid Conversion:**
- When user makes first payment, status changes from "trial" to "active"
- Email notification sent: "Subscription Activated"
- All trial fields remain in database (trial_start, trial_end)

---

### 6.2 Solo Plan Logic

**User Limit:** 1 user (owner only)  
**Monthly Price:** ₦10,000  
**Annual Price:** ₦108,000 (saves ₦12,000)

**Features:**
- Core farm tracking
- Basic analytics
- Email support

**Enforcement:**
- Checked in `lib/users/create-user.ts` (lines 76-110)
- If `currentUsers >= maxUsers` (1), returns error:
  - "Solo plan supports one user only. Upgrade to Team or Business to add users."

**Upgrade Path:** Can upgrade to Team or Business

---

### 6.3 Team Plan Logic

**User Limit:** 3 users  
**Monthly Price:** ₦15,000  
**Annual Price:** ₦162,000 (saves ₦18,000)

**Features:**
- Up to 3 users
- Full farm management
- Advanced analytics
- Priority support
- API access

**Enforcement:**
- Checked in `lib/users/create-user.ts` (lines 76-110)
- If `currentUsers >= maxUsers` (3), returns error:
  - "User limit reached for your subscription plan."

**Upgrade Path:** Can upgrade to Business

---

### 6.4 Business Plan Logic

**User Limit:** 6 users  
**Monthly Price:** ₦20,000  
**Annual Price:** ₦216,000 (saves ₦24,000)

**Features:**
- Up to 6 users
- Full farm management
- Custom analytics
- Dedicated support
- API access
- Priority onboarding

**Enforcement:**
- Checked in `lib/users/create-user.ts` (lines 76-110)
- If `currentUsers >= maxUsers` (6), returns error:
  - "User limit reached for your subscription plan."

**Upgrade Path:** No higher tier available

---

### 6.5 User Limit Enforcement

**Location:** `lib/users/create-user.ts` (lines 47-110)

**Process:**
1. Fetch subscription for farm
2. Count current farm_users for farm
3. Determine maxUsers based on plan:
   - trial: 1
   - solo: 1
   - team: 3
   - business: 6
   - default: 1
4. Compare `currentUsers >= maxUsers`
5. If limit reached, return error with plan-specific message
6. If under limit, proceed with user creation

**Called From:**
- `app/api/team/route.ts` (line 102) - When inviting team members
- Direct service call (not HTTP)

**Important:** This is the ONLY enforcement point for user limits.

---

### 6.6 Team Module Subscription Checks

**Location:** `app/api/team/route.ts` and `lib/users/create-user.ts`

**Flow:**
1. User attempts to invite team member via Team page
2. POST request to `/api/team`
3. Route handler calls `createUser()` service
4. `createUser()` checks subscription limits
5. If limit reached, returns error to user
6. If under limit, creates user and sends invitation

**No Other Subscription Checks:**
- Team module does NOT check if subscription is active
- Team module does NOT check if trial has expired
- Only checks user count limits

---

## 7. Dependency Analysis

### 7.1 Files That Depend on Subscription

#### Core Subscription Files
- `lib/subscription.ts` - Get subscription data
- `lib/flutterwave.ts` - Plan definitions and payment config
- `app/settings/subscription/page.tsx` - Main subscription UI

#### Team Workspace
- `app/api/team/route.ts` - Checks user limits before creating users
- `lib/users/create-user.ts` - Enforces subscription user limits
- `components/team/invite-member-dialog.tsx` - UI for inviting users (indirect)
- `app/team/page.tsx` - Team management page (indirect)

#### Settings
- `app/settings/subscription/page.tsx` - Subscription management page
- `app/settings/page.tsx` - Settings navigation (indirect)

#### Onboarding
- `lib/onboarding.ts` - Creates trial subscription during farm creation
- `app/onboarding/page.tsx` - Onboarding flow (indirect)

#### Dashboard
- `lib/dashboard.ts` - Fetches subscription data for dashboard
- `app/dashboard/page.tsx` - Displays trial badge (hardcoded)
- `components/dashboard/subscription-card.tsx` - Subscription info card
- `components/dashboard/farm-hero.tsx` - May display subscription info (indirect)

#### Billing
- `app/api/payments/verify/route.ts` - Payment verification and subscription activation
- `app/api/payments/history/route.ts` - Payment history retrieval
- `lib/email-service.ts` - Sends payment/subscription emails
- `lib/email-templates.ts` - Email templates for subscription events

#### Permissions
- `lib/permissions/constants.ts` - Defines subscription.manage and billing.manage permissions
- `lib/core/permissions.ts` - Permission definitions
- `hooks/usePermissions.ts` - Permission checking hooks

#### Email Automation
- `app/api/run-email-automation/route.ts` - Trial expiration emails
- `app/api/send-subscription-activated/route.ts` - Manual trigger for activation email
- `app/api/send-subscription-renewed/route.ts` - Manual trigger for renewal email
- `app/api/send-payment-received/route.ts` - Manual trigger for payment email

#### Layout/Navigation
- `components/layout/sidebar.tsx` - Settings navigation link (indirect)
- `components/layout/mobile-sidebar.tsx` - Mobile navigation (indirect)

---

## 8. Dependency Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    Subscription Workspace                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  UI Layer                                                 │  │
│  │  • app/settings/subscription/page.tsx                     │  │
│  │  • components/dashboard/subscription-card.tsx             │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API Layer                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  POST /api/payments/verify                                │  │
│  │  • Verifies Flutterwave payment                           │  │
│  │  • Updates subscription status                            │  │
│  │  • Creates payment record                                 │  │
│  │  • Sends email notifications                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  GET /api/payments/history                                │  │
│  │  • Retrieves payment history for farm                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  POST /api/team                                           │  │
│  │  • Checks subscription user limits                        │  │
│  │  • Creates team members                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  POST /api/run-email-automation                           │  │
│  │  • Sends trial expiration emails                          │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Database Layer                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Table: subscriptions                                     │  │
│  │  • plan, status, trial_start, trial_end                   │  │
│  │  • billing_cycle, next_billing_date                       │  │
│  │  • amount_paid, payment_reference, transaction_id         │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Table: payments                                          │  │
│  │  • Audit trail of all transactions                        │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Flutterwave Integration                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  • Payment Checkout (window.FlutterwaveCheckout)          │  │
│  │  • Payment Verification API                               │  │
│  │  • Transaction metadata (farm_id, plan, billing_cycle)    │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Team Workspace                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  • User limit enforcement (lib/users/create-user.ts)      │  │
│  │  • Team member creation (app/api/team/route.ts)           │  │
│  │  • Permission assignment                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Settings                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  • Subscription management page                           │  │
│  │  • Plan selection and upgrade                             │  │
│  │  • Payment history viewing                                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Risk Assessment

### 9.1 STABLE COMPONENTS - DO NOT MODIFY

The following components have been tested and are considered stable. Any modifications could break critical business flows:

#### Payment Flow (CRITICAL)
- **`app/api/payments/verify/route.ts`** - Payment verification and subscription activation
  - **Risk:** Breaking this will prevent users from activating subscriptions
  - **Risk:** Could cause duplicate payments or missed activations
  - **Risk:** Email notification logic is tightly coupled

- **`lib/flutterwave.ts`** - Plan definitions and payment configuration
  - **Risk:** Changing prices or plan definitions affects all new subscriptions
  - **Risk:** Public key configuration is critical for payment processing

- **`app/settings/subscription/page.tsx`** - Payment UI and Flutterwave integration
  - **Risk:** Frontend payment flow is tightly coupled to Flutterwave Checkout
  - **Risk:** Metadata structure must match backend expectations

#### User Limit Enforcement (CRITICAL)
- **`lib/users/create-user.ts`** - User limit enforcement logic
  - **Risk:** Breaking this could allow users to exceed plan limits
  - **Risk:** Could cause billing disputes or service abuse
  - **Risk:** Error messages are user-facing and must remain consistent

- **`app/api/team/route.ts`** - Team member creation
  - **Risk:** Directly calls createUser() service
  - **Risk:** Permission checks are coupled to user creation

#### Trial System (IMPORTANT)
- **`lib/onboarding.ts`** - Trial creation during onboarding
  - **Risk:** Breaking this prevents new farm creation
  - **Risk:** 14-day trial period is hardcoded

- **`app/api/run-email-automation/route.ts`** - Trial expiration emails
  - **Risk:** Breaking this prevents trial expiration notifications
  - **Risk:** Email bucketing logic is time-sensitive

#### Database Operations (CRITICAL)
- **Subscription table updates in `app/api/payments/verify/route.ts`**
  - **Risk:** Incorrect updates could corrupt subscription status
  - **Risk:** next_billing_date calculation must remain accurate

- **Payment record insertion**
  - **Risk:** Payment audit trail must remain intact
  - **Risk:** Duplicate payment detection relies on transaction_id uniqueness

### 9.2 INTEGRATION POINTS - HIGH RISK

#### Flutterwave Integration
- **Environment Variables:**
  - `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY` - Frontend payment initialization
  - `FLUTTERWAVE_SECRET_KEY` - Backend payment verification
  - **Risk:** Changing these will break payment processing

- **Metadata Structure:**
  - `farm_id`, `plan`, `billing_cycle` passed in Flutterwave meta
  - **Risk:** Changing metadata structure breaks payment verification

#### Email System
- **Email templates in `lib/email-templates.ts`**
  - `paymentReceivedTemplate`
  - `subscriptionActivatedTemplate`
  - `subscriptionRenewedTemplate`
  - **Risk:** Changing templates affects user communication

- **Email service in `lib/email-service.ts`**
  - **Risk:** Email sending logic is coupled to payment flow
  - **Risk:** Failure handling must remain graceful

### 9.3 PERMISSIONS - MODERATE RISK

- **`lib/permissions/constants.ts`**
  - `subscription.manage` - Controls access to subscription settings
  - `billing.manage` - Controls access to billing information
  - **Risk:** Changing permission codes breaks access control

### 9.4 DATA INTEGRITY CONCERNS

#### Subscription Status Transitions
- **Current Flow:** trial → active (on first payment)
- **No Other Transitions:** No logic for:
  - active → expired (manual or automatic)
  - active → cancelled
  - expired → active (re-activation)
- **Risk:** Adding new status transitions requires careful implementation

#### next_billing_date Calculation
- **Location:** `app/api/payments/verify/route.ts` (lines 73-83)
- **Logic:**
  - Annual: +1 year from current date
  - Monthly: +1 month from current date
- **Risk:** Date calculation errors could cause billing issues

### 9.5 WHAT MUST NOT BE CHANGED

1. **Payment verification flow** - End-to-end process from Flutterwave callback to database update
2. **User limit enforcement logic** - Switch statement in `create-user.ts`
3. **Trial creation logic** - 14-day trial period and field initialization
4. **Flutterwave metadata structure** - farm_id, plan, billing_cycle
5. **Email notification triggers** - Activation vs renewal determination logic
6. **Database field names** - Any changes require migration scripts
7. **Plan pricing** - Defined in `lib/flutterwave.ts`
8. **Permission codes** - subscription.manage, billing.manage

### 9.6 RECOMMENDED SAFE MODIFICATIONS

The following can be modified with minimal risk:

1. **UI/UX improvements** in `app/settings/subscription/page.tsx`
   - Styling, layout, animations
   - Additional display information (read-only)

2. **Email templates** in `lib/email-templates.ts`
   - Content and styling of emails
   - Must maintain function signatures

3. **Dashboard display** in `app/dashboard/page.tsx`
   - How subscription status is displayed
   - Additional metrics or information

4. **Trial email timing** in `app/api/run-email-automation/route.ts`
   - Adjusting when emails are sent (2 days, 4 days, etc.)
   - Adding additional email buckets

5. **Error messages** - User-facing error text can be updated for clarity

---

## Appendix A: File Inventory

### Subscription-Related Files
```
lib/
├── flutterwave.ts                      # Plan definitions, public key
├── subscription.ts                     # Get subscription data
├── onboarding.ts                       # Trial creation
├── dashboard.ts                        # Dashboard data fetching
├── email-service.ts                    # Email sending logic
├── email-templates.ts                  # Email HTML templates
└── users/
    └── create-user.ts                  # User creation with limit checks

app/
├── settings/
│   └── subscription/
│       └── page.tsx                    # Main subscription page
├── api/
│   ├── payments/
│   │   ├── verify/
│   │   │   └── route.ts                # Payment verification
│   │   └── history/
│   │       └── route.ts                # Payment history
│   ├── team/
│   │   └── route.ts                    # Team management
│   ├── run-email-automation/
│   │   └── route.ts                    # Trial email automation
│   ├── send-subscription-activated/
│   │   └── route.ts                    # Activation email trigger
│   ├── send-subscription-renewed/
│   │   └── route.ts                    # Renewal email trigger
│   └── send-payment-received/
│       └── route.ts                    # Payment email trigger
└── dashboard/
    └── page.tsx                        # Dashboard with trial badge

components/
├── dashboard/
│   └── subscription-card.tsx           # Subscription info card
└── [other components with indirect dependencies]

lib/
└── permissions/
    └── constants.ts                     # Permission definitions
```

---

## Appendix B: Environment Variables

### Required for Subscription System
```
# Flutterwave
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=<public_key>
FLUTTERWAVE_SECRET_KEY=<secret_key>

# Email Automation
AUTOMATION_SECRET=<secret_for_cron_jobs>

# Supabase (used throughout)
NEXT_PUBLIC_SUPABASE_URL=<url>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

---

## Appendix C: Database Schema Reference

### subscriptions Table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id),
  plan TEXT NOT NULL DEFAULT 'trial',
  status TEXT NOT NULL DEFAULT 'trial',
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  billing_cycle TEXT, -- 'monthly' or 'annual'
  next_billing_date TIMESTAMPTZ,
  amount_paid DECIMAL,
  payment_reference TEXT,
  transaction_id TEXT,
  selected_plan TEXT, -- Note: Not used in current code, plan field is used instead
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id),
  plan TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  amount_paid DECIMAL NOT NULL,
  transaction_id TEXT NOT NULL,
  payment_reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Document End

**This document is for READ-ONLY inspection purposes. No functional code changes are permitted based on this audit.**

**Next Steps (if modifications are required):**
1. Review this audit with stakeholders
2. Create detailed change request for each modification
3. Update this document with proposed changes
4. Get approval before implementing any changes
5. Test all payment flows in staging environment
6. Deploy with monitoring for payment failures