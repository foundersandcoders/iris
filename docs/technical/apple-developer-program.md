# Apple Developer Program: Cost-Benefit Analysis

**Audience:** Dan (Manager, Developer Training Lead)
**Context:** macOS desktop app distribution for internal tools
**Date:** 2026-01-11

---

## The Question

Should we pay £79/year ($99 USD) for an Apple Developer Program membership to sign and notarize macOS apps?

---

## What You Get

### With Developer Program (£79/year)

**Code Signing Certificate:**
- Developer ID Application certificate
- Valid for macOS app distribution outside App Store
- Trusted by macOS Gatekeeper

**Notarization Service:**
- Apple scans app for malware
- Staples approval ticket to app bundle
- Required for apps to run without warnings on macOS 10.15+

**User Experience:**
- ✅ App opens immediately (double-click works)
- ✅ No security warnings
- ✅ Shows "Verified by Apple"
- ✅ Professional, trusted distribution

**Technical:**
- Valid for all apps you build
- Certificate lasts 1 year (auto-renew with membership)
- Works for all macOS versions from 10.9+

---

## What You Don't Get

### Without Developer Program (Free)

**Ad-Hoc Signing (Free Apple ID):**
- Basic code signature (required on Apple Silicon)
- **Cannot** be notarized
- **Cannot** bypass Gatekeeper warnings

**User Experience:**
- ❌ Gatekeeper blocks app on first open
- ❌ Scary warning: "App is damaged and can't be opened"
- ❌ User must: Right-click → Open → Override security warning
- ❌ Shows "Unidentified Developer"
- ❌ Many users won't trust it

**Workarounds (All Bad):**
- Manual approval: System Settings → Privacy & Security → "Open Anyway"
- Terminal command: `xattr -cr Iris.app` (requires technical knowledge)
- Email instructions: "How to override macOS security warnings"

**Reality Check:**
- Non-technical staff won't do this
- Creates support burden
- Looks unprofessional
- Security team may block it

---

## Real-World Scenarios

### Scenario 1: Internal Tool (10 Staff Members)

**With Developer Program:**
- Deploy once, works for everyone
- 2 minutes per user (download, double-click, done)
- Total: 20 minutes

**Without Developer Program:**
- Deploy with manual override instructions
- 10-15 minutes per user (troubleshooting, IT support calls)
- Total: 100-150 minutes
- Ongoing support requests

**Cost calculation:**
- £79/year ÷ 150 minutes saved = **£0.53 per minute saved**
- If staff time costs £30/hour: 150 minutes = **£75 in wasted time**

---

### Scenario 2: Multiple Internal Tools

**With Developer Program:**
- Certificate works for **all** macOS apps you build
- Build validator tools, admin dashboards, automation utilities
- One-time £79 covers everything

**Without Developer Program:**
- Every app requires manual override on every machine
- Support burden multiplies with each tool
- Users stop trusting internal tools

---

### Scenario 3: Developer Training Context

**With Developer Program:**
- Students build real, deployable macOS apps
- Experience professional distribution workflow
- Learn industry-standard practices
- Apps they build actually work when distributed

**Without Developer Program:**
- Students learn workarounds, not best practices
- Apps they build can't be easily distributed
- Gap between training and professional reality

**Educational value:**
- Code signing is a key skill for macOS developers
- Notarization is standard practice (not optional in 2026)
- Students should learn the real process

---

## Technical Requirements

### What You Need to Sign & Notarize

**Hardware:**
- Mac with Xcode command-line tools installed
- No Apple Silicon requirement (works on Intel too)

**Software:**
```bash
# Sign the app
codesign --deep --force --sign "Developer ID Application: Your Name" Iris.app

# Notarize
xcrun notarytool submit Iris.app.zip \
  --apple-id "your@email.com" \
  --team-id "TEAM_ID" \
  --password "app-specific-password" \
  --wait

# Staple approval
xcrun stapler staple Iris.app
```

**Time investment:**
- Initial setup: 30 minutes (create certificate, configure Xcode)
- Per app: 5-10 minutes (automated in build process)
- Can be scripted/automated with Tauri config

---

## Alternatives Considered

### 1. Web App Instead of Desktop App
**Pros:** No code signing needed
**Cons:**
- Requires server hosting
- No offline functionality
- Different UX paradigm
- Different tech stack (increases training complexity)

### 2. Electron (Current Approach)
**Reality:** Electron apps **also** need code signing for professional distribution. Same £79 cost.

### 3. Linux/Windows Only
**Cons:**
- Founders and Coders staff use macOS
- Excludes primary users
- Not a solution

### 4. "Just Tell Users to Override Security"
**Cons:**
- Support burden
- Looks unprofessional
- Security team may block
- Poor user experience
- Wastes more than £79 in staff time

---

## Recommendation

### Pay the £79/year

**Why:**
1. **Cost is negligible:** Less than 2 hours of developer time at standard rates
2. **Professional UX:** Apps work as users expect
3. **Scales:** Certificate covers all macOS apps you build
4. **Educational:** Students learn real-world practices
5. **Time savings:** Avoids support burden and manual workarounds

**When to do it:**
- Before deploying any macOS app to staff
- Before asking students to build distributed macOS apps
- Before replacing existing Electron tools

**When to skip it:**
- Personal projects (free ad-hoc signing is fine)
- Development/testing only (no distribution)
- Apps that will never leave your personal machine

---

## Current State: Iris

**Without Developer Program:**
```bash
# Users must do this on first launch:
# 1. Download Iris.app
# 2. Try to open → blocked by Gatekeeper
# 3. System Settings → Privacy & Security → "Open Anyway"
# 4. Confirm security override
# 5. App finally opens
```

**With Developer Program:**
```bash
# Users do this on first launch:
# 1. Download Iris.app
# 2. Double-click
# 3. App opens
```

---

## Action Items

**If you approve the cost:**
1. Sign up for Apple Developer Program (developer.apple.com/programs)
2. Pay £79/year (recurring)
3. Generate Developer ID certificate (30 minutes, one-time)
4. Configure Tauri build process (automated signing)
5. Document signing workflow for students

**If you don't approve the cost:**
1. Document manual override process for staff
2. Prepare for support requests
3. Accept that apps will look "untrusted"
4. Budget extra time for troubleshooting
5. Consider if this impacts training quality

---

## Bottom Line

**£79/year buys:**
- Professional user experience
- Time savings (avoids support burden)
- Educational value (real-world practices)
- Scalability (all apps, all users)

**£0/year costs:**
- Support time (likely exceeds £79)
- Credibility (apps look sketchy)
- User frustration
- Reduced tool adoption

**Decision:** This is a "cost of doing business" expense for macOS development. The question isn't "Should we pay?" but "Can we afford **not** to pay?"

---

## References

- [Apple Developer Program](https://developer.apple.com/programs/)
- [Developer ID and Gatekeeper](https://developer.apple.com/developer-id/)
- [Notarizing macOS Software](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Tauri Code Signing](https://v2.tauri.app/distribute/sign/macos/)
