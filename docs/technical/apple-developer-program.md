# Apple Developer Program: Should We Pay £79/Year?

We're distributing Iris' desktop GUI to non-technical staff. I've implemented free ad-hoc signing that solves the Apple Silicon requirement, but it creates friction for users. The TUI and CLI aren't affected by these signing issues.

This affects any macOS desktop app we create, not just Iris. The £79/year fee covers signing certificates for all apps we build.

---

## Current State: The `iris sign` Command

I've implemented automated ad-hoc signing - the best option without paying Apple:

```bash
bun tauri:build
iris sign  # Automated ad-hoc signature
```

### Why This Exists

**Apple Silicon requires all code to be signed.** Without any signature, apps won't launch on M1/M2/M3 Macs. This isn't optional.

The `iris sign` command satisfies that minimum requirement with zero cost.

### What It Solves

✅ Apps run on Apple Silicon (critical blocker removed)
✅ Automated development workflow
✅ Immediate distribution capability

### What It Doesn't Solve

❌ **Gatekeeper warnings** - Users see "App is damaged and can't be opened"
❌ **No notarization** - Never shows "Verified by Apple"
❌ **7-step override process** - Confusing for non-technical staff
❌ **Update friction** - May re-trigger warnings (Gatekeeper bug)

### User Experience Gap

**Current (ad-hoc signed):**
1. Download app
2. Double-click
3. ❌ Security warning
4. System Settings → Privacy & Security → "Open Anyway"
5. Confirm override
6. App launches
7. (May repeat steps 3-6 on updates)

**With Developer ID (£79/year):**
1. Download app
2. Double-click
3. ✅ App launches immediately

I've automated everything that's free to automate. The remaining friction is an Apple policy constraint.

---

## When It's Worth It

**Good fit for:**
- 3+ internal tools distributed to non-technical staff
- Student education (industry standard practices)
- Public distribution potential
- Professional image

**Can wait for:**
- Early prototypes (ad-hoc works for testing)
- Tools with only technical users (1-2 people)
- Personal side projects

**Current reality:** 3 developers building ~6 tools/year for non-technical staff, with educational mission and distribution goals.

---

## Alternatives Considered

**Web app instead?**
- Requires server hosting
- No offline functionality
- Different tech stack

**Three signing scenarios:**

1. **Apple Developer Program (£79/year):** Apps open immediately, no warnings
2. **Ad-hoc signing via `iris sign` (free):** Apps can be overridden by users after security warning
3. **No signing (free):** Apps won't launch at all on Apple Silicon Macs

The `iris sign` command is the minimum required solution. Without it, there's no way to distribute desktop apps on modern Macs.

**Electron needs the same signing.** Not a workaround.

---

## Technical Setup

**One-time (30 minutes):**

```bash
# Generate certificate via developer.apple.com
# Configure Tauri with signing identity
```

**Per build (automated):**

```bash
codesign --sign "Developer ID Application: Name" Iris.app
xcrun notarytool submit Iris.app.zip --wait
xcrun stapler staple Iris.app
```

Can be fully scripted in Tauri config.

---

## Bottom Line

The `iris sign` command provides a functional baseline. The paid program would remove the friction currently limiting adoption.

For the current use case (multiple tools, non-technical users, educational mission), there's a case for the £79/year. But there's a working solution either way.
