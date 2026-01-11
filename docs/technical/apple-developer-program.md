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
- Non-technical staff won't do this reliably
- Creates ongoing support burden
- Undermines tool adoption (friction on every install)
- Security-conscious users may refuse

**macOS Sequoia (2024+) Change:**
- Right-click override removed
- Must use System Settings → Privacy & Security
- Even more steps, even more friction

**Gatekeeper Override Persistence:**
- Override should persist after first approval
- **Known bug:** App updates can re-trigger warnings
- Staff may need to override again with each update

---

## Real-World Impact

### Scenario: 6 Internal Tools Per Year

**Context:**
- 3 developers building internal macOS tools
- Each developer creates ~2 tools annually
- Total: 6 new tools per year
- Each tool distributed to non-technical staff
- Minimum 1 update/year (ILR schema changes), likely more

### With Developer Program (£79/year)

**First install:**
- Staff receives link to download
- Double-click `.app` file
- App opens immediately
- **Time per person:** 1 minute

**Updates (6 tools × 1+ updates/year):**
- Download new version
- Replace old version
- Double-click
- App opens immediately
- **Time per person:** 1 minute per update

**Staff motivation:**
- No friction
- Tools "just work"
- Professional experience
- High adoption rate

### Without Developer Program (Free)

**First install (per tool, per person):**
1. Download app
2. Double-click → blocked by Gatekeeper
3. Google "macOS app is damaged"
4. Navigate to System Settings → Privacy & Security
5. Find app in list, click "Open Anyway"
6. Confirm override dialog
7. App finally opens
- **Time per person:** 5-10 minutes
- **Support requests:** High (steps 3-6 confuse non-technical users)

**Updates (known Gatekeeper bug):**
- Update may re-trigger warnings
- Staff must repeat override process
- Some staff give up and keep using old version
- **Time per person:** 5-10 minutes per affected update
- **Motivation impact:** Tool fatigue, reduced adoption

### Time Impact Over One Year

**Assumptions:**
- 6 new tools released
- Average 5 staff members per tool (30 total installs)
- 6 tools receive updates (30 total updates)
- 50% of updates re-trigger Gatekeeper bug (15 re-overrides)

**With paid signing:**
- Initial installs: 30 × 1 min = 30 minutes
- Updates: 30 × 1 min = 30 minutes
- **Total: 1 hour across all staff**

**Without paid signing:**
- Initial installs: 30 × 7 min = 210 minutes (3.5 hours)
- Updates: 15 × 7 min = 105 minutes (1.75 hours)
- Support time: ~2 hours (email threads, Slack messages, video calls)
- **Total: 7.25 hours across all staff and support**

**Difference: 6.25 hours saved per year**

But more importantly:

**Motivation Impact:**
- Staff less likely to try new internal tools
- Updates avoided due to friction
- "This tool is more trouble than it's worth" mentality
- Internal tools fail to reach adoption potential

---

### Wider Distribution Potential

**With Developer Program:**
- Can share tools publicly (GitHub releases, website)
- Other apprenticeship providers could use your tools
- Builds Founders and Coders' reputation for quality tooling
- Students' apps can be properly distributed

**Without Developer Program:**
- Distribution limited to technical users who understand overrides
- Can't professionally share tools beyond organization
- Missed opportunity for wider impact

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

## Current Solution: `iris sign` Command

**Status:** Implemented - best available option without paid program

### What I've Built

To work within current constraints, I've implemented automated ad-hoc signing:

```bash
# After building the app
bun tauri:build

# Sign with ad-hoc signature
iris sign

# Or use package script
bun tauri:sign
```

**How it works:**
- Automated wrapper around `codesign --deep --force --verify --verbose --sign "-" Iris.app`
- Checks app exists before attempting to sign
- Works only on macOS (graceful error on other platforms)
- Zero cost (no Apple Developer Program required)

### What This Solves

✅ **Apple Silicon requirement (critical):**
- macOS on ARM64 (M1/M2/M3) **requires** all code to be signed
- Without any signature, app won't run at all on Apple Silicon
- Ad-hoc signing satisfies this minimum requirement
- **This is mandatory for deployment on modern Macs**

✅ **Development workflow:**
- Quick, automated signing for local testing
- No manual `codesign` commands needed
- Integrated into build process
- Consistent signing across developers

✅ **Immediate availability:**
- Tools can be distributed right now
- No waiting for program approval
- Technical users can run apps (with override)

### What This Doesn't Solve

The limitations here are imposed by Apple's security model, not by the implementation:

❌ **Gatekeeper warnings:**
- Ad-hoc signed apps still show "Unidentified Developer"
- Users see security warnings
- Requires manual override process (System Settings on Sequoia)

❌ **Notarization:**
- Cannot submit ad-hoc signed apps to Apple
- App will never show "Verified by Apple"
- No automated malware scanning

❌ **Friction for non-technical users:**
- Override process confusing for staff
- Support burden persists
- Reduces tool adoption

❌ **Update behavior:**
- May re-trigger warnings on updates (Gatekeeper bug)
- Staff must re-override for some updates
- Creates ongoing friction

### User Experience Comparison

**With `iris sign` (Current approach):**
```
1. Download Iris.app
2. Double-click
3. ❌ "App is damaged and can't be opened"
4. System Settings → Privacy & Security → "Open Anyway"
5. Confirm override: "Open"
6. App launches
7. (Updates may repeat steps 3-6 due to Gatekeeper bug)
```

**With Developer ID (Paid program):**
```
1. Download Iris.app
2. Double-click
3. ✅ App launches immediately
4. (Updates: same experience)
```

### When This Works Well

**Good fit for:**
- Development and testing (essential for Apple Silicon)
- Distribution to developers (who understand the override)
- Personal tools (one-person use)
- Getting started before program approval

**Not ideal for:**
- Non-technical staff (override process is confusing)
- Production tools (creates support burden)
- Wider distribution (limits reach and adoption)
- Professional image (looks untrustworthy)

### Educational Context

**For students learning macOS development:**
- Shows them the difference between ad-hoc and proper signing
- Real-world experience with Gatekeeper
- Understands why apps need proper certificates
- Valuable lesson in production deployment requirements

But students' apps can't be professionally distributed without proper signing.

### What This Means

The `iris sign` command provides the best experience possible without the paid Developer Program. It removes the Apple Silicon blocker and streamlines the signing process.

However, it can't eliminate Gatekeeper friction - that requires Apple's approval via notarization, which requires the paid program.

Think of it as: **I've automated everything that's automatable for free. The remaining friction is an Apple policy constraint, not a technical limitation.**

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
**This is the current state with `iris sign`.**

**Pros:**
- Free (no Developer Program needed)
- Works for technical users

**Cons:**
- 7-step process for non-technical users
- Ongoing support burden
- Undermines tool adoption
- May re-trigger on updates (Gatekeeper bug)

---

## Recommendation

### For Internal Tools: Developer Program Worth It

**The case for £79/year:**

**1. Eliminates friction**
- 6.25 hours saved per year across all staff
- But more importantly: removes psychological barrier to adoption
- Staff actually use internal tools when they "just work"

**2. Scales across all tools**
- One certificate covers 6+ tools per year
- Certificate works for all developers
- Students' apps can be properly distributed

**3. Enables wider distribution**
- Can share tools publicly (GitHub, website)
- Other apprenticeship providers could benefit
- Builds Founders and Coders' reputation for quality tooling

**4. Professional standards**
- Students learn real-world deployment practices
- Code signing is industry standard (not optional in 2026)
- Aligns with professional software development expectations

**5. Business expense context**
- £79/year is ~2-3 hours of developer time
- Saves more time than it costs
- Avoids reputational cost of "sketchy" internal tools

### When to Do It

**Good timing:**
- Before Iris MVP deployment to staff
- When building second or third internal tool (amortize across tools)
- Before asking students to build distributed macOS apps

**Can wait:**
- Early prototypes (ad-hoc signing works for testing)
- Tools with only 1-2 technical users
- Personal side projects

---

## Current State: Iris

**What's implemented:**
- `iris sign` command (automated ad-hoc signing)
- Solves Apple Silicon requirement
- Works for development and testing

**What's still needed for production:**
- Developer ID signing (£79/year)
- Notarization workflow
- Staff-facing deployment without friction

**The gap:**
- Ad-hoc: 7 steps to open, support burden, reduced adoption
- Developer ID: 3 steps to open, no support, high adoption

---

## Action Items

### If You Proceed with Developer Program

1. **Sign up:** developer.apple.com/programs (£79/year, business expense)
2. **Generate certificate:** 30 minutes one-time setup
3. **Configure Tauri:** Update `tauri.conf.json` with signing identity
4. **Automate notarization:** Add to build script
5. **Document for students:** Include in macOS development training

**Timeline:** Can be set up in one afternoon, works for all future builds.

### If You Stay with Ad-Hoc Signing

1. **Document override process:** Create guide for staff
2. **Set expectations:** Tools will show security warnings
3. **Budget support time:** ~2 hours/year for override help
4. **Accept adoption impact:** Some staff may avoid tools due to friction
5. **Revisit decision:** When tool count reaches 3-4 (amortization improves)

---

## Bottom Line

**Developer Program (£79/year) provides:**
- Friction-free tool deployment
- High adoption (staff actually use tools)
- Professional distribution capability
- Students learn industry standards
- Scales across all macOS tools

**Ad-hoc signing (free) provides:**
- Apple Silicon compatibility (required)
- Development/testing workflow
- Technical user distribution
- Starting point while evaluating

**The decision:**
- For 1-2 internal tools with technical users: Ad-hoc works
- For 3+ tools distributed to non-technical staff: Developer Program justifies itself
- For student education + wider distribution: Developer Program aligns with goals

**Current state:** You have 3 developers building ~6 tools/year for non-technical staff, with educational mission and distribution potential. This fits the "Developer Program justifies itself" profile.

But the choice is yours based on priorities and constraints. The `iris sign` command gives you a functional option either way.

---

## References

- [Apple Developer Program](https://developer.apple.com/programs/)
- [Developer ID and Gatekeeper](https://developer.apple.com/developer-id/)
- [Notarizing macOS Software](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Tauri Code Signing](https://v2.tauri.app/distribute/sign/macos/)
